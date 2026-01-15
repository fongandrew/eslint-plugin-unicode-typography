import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

export type MessageIds =
	| 'preferEllipsis'
	| 'preferEmdash'
	| 'preferEndash'
	| 'preferQuotes'
	| 'preferApostrophe'
	| 'preferPrime';

export type Options = [
	{
		ellipsis?: boolean;
		emdash?: boolean;
		endash?: boolean;
		quotes?: boolean;
		apostrophes?: boolean;
		primes?: boolean;
		exemptElements?: string[];
	},
];

// Unicode characters
const CHARS = {
	ELLIPSIS: '\u2026', // …
	EMDASH: '\u2014', // —
	ENDASH: '\u2013', // –
	LEFT_DOUBLE: '\u201C', // “
	RIGHT_DOUBLE: '\u201D', // ”
	LEFT_SINGLE: '\u2018', // ‘
	RIGHT_SINGLE: '\u2019', // ’ (also used for apostrophe)
	PRIME: '\u2032', // ′
	DOUBLE_PRIME: '\u2033', // ″
};

// Code-like JSX attributes that should not be checked
const CODE_LIKE_ATTRIBUTES = new Set([
	'className',
	'class',
	'id',
	'style',
	'href',
	'src',
	'data-testid',
	'key',
]);

// Default exempt JSX elements
const DEFAULT_EXEMPT_ELEMENTS = ['code', 'pre'];

// Get element name from JSX identifier
function getElementName(
	node: TSESTree.JSXIdentifier | TSESTree.JSXMemberExpression | TSESTree.JSXNamespacedName,
): string {
	if (node.type === AST_NODE_TYPES.JSXIdentifier) {
		return node.name;
	}
	if (node.type === AST_NODE_TYPES.JSXMemberExpression) {
		return `${getElementName(node.object)}.${node.property.name}`;
	}
	if (node.type === AST_NODE_TYPES.JSXNamespacedName) {
		return `${node.namespace.name}:${node.name.name}`;
	}
	return '';
}

interface Replacement {
	messageId: MessageIds;
	start: number;
	end: number;
	replacement: string;
}

const rule: TSESLint.RuleModule<MessageIds, Options> = {
	defaultOptions: [{}],
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce use of Unicode typography characters',
		},
		fixable: 'code',
		schema: [
			{
				type: 'object',
				properties: {
					ellipsis: { type: 'boolean' },
					emdash: { type: 'boolean' },
					endash: { type: 'boolean' },
					quotes: { type: 'boolean' },
					apostrophes: { type: 'boolean' },
					primes: { type: 'boolean' },
					exemptElements: {
						type: 'array',
						items: { type: 'string' },
					},
				},
				additionalProperties: false,
			},
		],
		messages: {
			preferEllipsis: 'Use ellipsis character (\u2026) instead of three dots (...)',
			preferEmdash: 'Use em dash (\u2014) instead of double hyphen (--)',
			preferEndash: 'Use en dash (\u2013) instead of spaced hyphen ( - )',
			preferQuotes:
				'Use smart quotes (\u201C\u201D or \u2018\u2019) instead of straight quotes',
			preferApostrophe: 'Use smart apostrophe (\u2019) instead of straight apostrophe',
			preferPrime: 'Use prime (\u2032) or double prime (\u2033) for measurements',
		},
	},
	create(context) {
		const options = context.options[0] ?? {};
		const {
			ellipsis: checkEllipsis = true,
			emdash: checkEmdash = true,
			endash: checkEndash = true,
			quotes: checkQuotes = true,
			apostrophes: checkApostrophes = true,
			primes: checkPrimes = true,
			exemptElements = DEFAULT_EXEMPT_ELEMENTS,
		} = options;

		// Track JSX element context for exempt elements
		const jsxElementStack: string[] = [];

		// Check if currently inside an exempt element
		function isInExemptElement(): boolean {
			return jsxElementStack.some(
				(el) => exemptElements.includes(el) || exemptElements.includes(el.toLowerCase()),
			);
		}

		// Find all replacements in a text string
		function findReplacements(text: string, baseOffset: number): Replacement[] {
			const replacements: Replacement[] = [];

			// Check for ellipsis: ...
			if (checkEllipsis) {
				const ellipsisRegex = /\.\.\./g;
				let match;
				while ((match = ellipsisRegex.exec(text)) !== null) {
					replacements.push({
						messageId: 'preferEllipsis',
						start: baseOffset + match.index,
						end: baseOffset + match.index + 3,
						replacement: CHARS.ELLIPSIS,
					});
				}
			}

			// Check for emdash: --
			if (checkEmdash) {
				const emdashRegex = /--/g;
				let match;
				while ((match = emdashRegex.exec(text)) !== null) {
					replacements.push({
						messageId: 'preferEmdash',
						start: baseOffset + match.index,
						end: baseOffset + match.index + 2,
						replacement: CHARS.EMDASH,
					});
				}
			}

			// Check for endash: " - " (space-hyphen-space)
			if (checkEndash) {
				const endashRegex = / - /g;
				let match;
				while ((match = endashRegex.exec(text)) !== null) {
					replacements.push({
						messageId: 'preferEndash',
						start: baseOffset + match.index,
						end: baseOffset + match.index + 3,
						replacement: CHARS.ENDASH,
					});
				}
			}

			// Smart quotes and apostrophes need more complex handling
			// We process them character by character to determine context

			if (checkQuotes || checkApostrophes || checkPrimes) {
				// Process double quotes
				if (checkQuotes) {
					// Find all straight double quotes
					const doubleQuoteRegex = /"/g;
					let match;
					const doubleQuotePositions: number[] = [];
					while ((match = doubleQuoteRegex.exec(text)) !== null) {
						doubleQuotePositions.push(match.index);
					}

					// Pair them up as opening/closing
					for (let i = 0; i < doubleQuotePositions.length; i++) {
						const pos = doubleQuotePositions[i];
						const isOpening = i % 2 === 0;
						replacements.push({
							messageId: 'preferQuotes',
							start: baseOffset + pos,
							end: baseOffset + pos + 1,
							replacement: isOpening ? CHARS.LEFT_DOUBLE : CHARS.RIGHT_DOUBLE,
						});
					}
				}

				// Process single quotes and apostrophes
				const singleQuoteRegex = /'/g;
				let match;
				while ((match = singleQuoteRegex.exec(text)) !== null) {
					const pos = match.index;
					const prevChar = pos > 0 ? text[pos - 1] : '';
					const nextChar = pos < text.length - 1 ? text[pos + 1] : '';

					// Check if it's an apostrophe (between word characters)
					const isApostrophe = /\w/.test(prevChar) && /\w/.test(nextChar);

					// Check if it's a year abbreviation ('99) or start-of-word contraction
					const isYearAbbrev = (/\s/.test(prevChar) || pos === 0) && /\d/.test(nextChar);

					// Check if it's after a digit (likely prime for measurement)
					const isPrime = /\d/.test(prevChar);

					if (isApostrophe) {
						if (checkApostrophes) {
							replacements.push({
								messageId: 'preferApostrophe',
								start: baseOffset + pos,
								end: baseOffset + pos + 1,
								replacement: CHARS.RIGHT_SINGLE,
							});
						}
						// If apostrophes disabled, skip this character entirely
					} else if (isYearAbbrev) {
						if (checkApostrophes) {
							replacements.push({
								messageId: 'preferApostrophe',
								start: baseOffset + pos,
								end: baseOffset + pos + 1,
								replacement: CHARS.RIGHT_SINGLE,
							});
						}
						// If apostrophes disabled, skip this character entirely
					} else if (isPrime && checkPrimes) {
						replacements.push({
							messageId: 'preferPrime',
							start: baseOffset + pos,
							end: baseOffset + pos + 1,
							replacement: CHARS.PRIME,
						});
					} else if (checkQuotes) {
						// It's a quote - determine opening vs closing
						// Opening if preceded by whitespace/start or opening bracket
						const isOpening = pos === 0 || /[\s([{]/.test(prevChar) || prevChar === '';
						replacements.push({
							messageId: 'preferQuotes',
							start: baseOffset + pos,
							end: baseOffset + pos + 1,
							replacement: isOpening ? CHARS.LEFT_SINGLE : CHARS.RIGHT_SINGLE,
						});
					}
				}

				// Process double prime for measurements (after digit)
				if (checkPrimes) {
					const doublePrimeRegex = /(\d)"/g;
					let primeMatch;
					while ((primeMatch = doublePrimeRegex.exec(text)) !== null) {
						// Find if we already have a replacement for this position
						const quotePos = primeMatch.index + 1; // Position of the "
						const existingIdx = replacements.findIndex(
							(r) =>
								r.start === baseOffset + quotePos && r.messageId === 'preferQuotes',
						);
						if (existingIdx !== -1) {
							// Replace the quote replacement with prime
							replacements[existingIdx] = {
								messageId: 'preferPrime',
								start: baseOffset + quotePos,
								end: baseOffset + quotePos + 1,
								replacement: CHARS.DOUBLE_PRIME,
							};
						}
					}
				}
			}

			// Sort by position and remove duplicates
			replacements.sort((a, b) => a.start - b.start);

			// Remove overlapping replacements (keep the first one)
			const filtered: Replacement[] = [];
			let lastEnd = -1;
			for (const r of replacements) {
				if (r.start >= lastEnd) {
					filtered.push(r);
					lastEnd = r.end;
				}
			}

			return filtered;
		}

		// Report and fix replacements
		function reportReplacements(node: TSESTree.Node, replacements: Replacement[]): void {
			for (const r of replacements) {
				context.report({
					node,
					messageId: r.messageId,
					fix(fixer) {
						return fixer.replaceTextRange([r.start, r.end], r.replacement);
					},
				});
			}
		}

		// Check a text node with its raw source range
		function checkText(node: TSESTree.Node, text: string, rangeStart: number): void {
			const replacements = findReplacements(text, rangeStart);
			reportReplacements(node, replacements);
		}

		return {
			// Track JSX element context - use JSXElement to cover entire element
			JSXElement(node) {
				if (node.openingElement?.name) {
					jsxElementStack.push(getElementName(node.openingElement.name));
				}
			},
			'JSXElement:exit'() {
				jsxElementStack.pop();
			},

			// Check string literals
			Literal(node) {
				if (typeof node.value !== 'string') return;

				// Skip if parent is a JSX attribute (handled by JSXAttribute visitor)
				const parent = node.parent;
				if (parent?.type === AST_NODE_TYPES.JSXAttribute) {
					return;
				}

				// The range includes quotes, so offset by 1
				checkText(node, node.value, node.range[0] + 1);
			},

			// Check template literal quasi elements
			TemplateElement(node) {
				const text = node.value.raw;
				// Template element range includes the backticks/braces
				// The actual text starts after ` or }
				checkText(node, text, node.range[0] + 1);
			},

			// Check JSX text (respecting exempt elements)
			JSXText(node) {
				if (isInExemptElement()) return;
				checkText(node, node.value, node.range[0]);
			},

			// Check JSX attribute values (but not code-like attributes)
			JSXAttribute(node) {
				// Skip code-like attributes
				if (
					node.name.type === AST_NODE_TYPES.JSXIdentifier &&
					CODE_LIKE_ATTRIBUTES.has(node.name.name)
				) {
					return;
				}

				// Check the value if it's a string literal
				if (
					node.value?.type === AST_NODE_TYPES.Literal &&
					typeof node.value.value === 'string'
				) {
					// Range includes quotes, offset by 1
					checkText(node.value, node.value.value, node.value.range[0] + 1);
				}
			},
		};
	},
};

export default rule;
