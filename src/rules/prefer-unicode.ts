import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';

export type MessageIds =
	| 'preferEllipsis'
	| 'preferEmdash'
	| 'preferEndash'
	| 'preferQuotes'
	| 'preferApostrophe'
	| 'preferPrime';

// Trinary option types
type CheckStringLiteralsOption = boolean | { onlyFunctions: string[] };
type CheckTemplateLiteralsOption = boolean | { tags?: string[]; untagged?: boolean };
type CheckAttributesOption = boolean | { onlyAttributes: string[] };
type CheckChildrenOption = boolean | { onlyComponents: string[] };

export type Options = [
	{
		// Replacement type toggles
		ellipsis?: boolean;
		emdash?: boolean;
		endash?: boolean;
		quotes?: boolean;
		apostrophes?: boolean;
		primes?: boolean;
		// Scope options
		checkStringLiterals?: CheckStringLiteralsOption;
		checkTemplateLiterals?: CheckTemplateLiteralsOption;
		checkAttributes?: CheckAttributesOption;
		checkChildren?: CheckChildrenOption;
	},
];

// Unicode characters
const CHARS = {
	ELLIPSIS: '\u2026', // …
	EMDASH: '\u2014', // —
	ENDASH: '\u2013', // –
	LEFT_DOUBLE: '\u201C', // "
	RIGHT_DOUBLE: '\u201D', // "
	LEFT_SINGLE: '\u2018', // '
	RIGHT_SINGLE: '\u2019', // ' (also used for apostrophe)
	PRIME: '\u2032', // ′
	DOUBLE_PRIME: '\u2033', // ″
};

// Default attributes to check
const DEFAULT_CHECKED_ATTRIBUTES = ['title', 'alt', 'label', 'aria-label', 'aria-describedby'];

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

// Get the callee name from a call expression (handles both simple and member expressions)
function getCalleeName(node: TSESTree.CallExpression): string | null {
	if (node.callee.type === AST_NODE_TYPES.Identifier) {
		return node.callee.name;
	}
	if (node.callee.type === AST_NODE_TYPES.MemberExpression) {
		const parts: string[] = [];
		let current: TSESTree.Expression = node.callee;
		while (current.type === AST_NODE_TYPES.MemberExpression) {
			if (current.property.type === AST_NODE_TYPES.Identifier) {
				parts.unshift(current.property.name);
			}
			current = current.object;
		}
		if (current.type === AST_NODE_TYPES.Identifier) {
			parts.unshift(current.name);
		}
		return parts.join('.');
	}
	return null;
}

// Get tag name from tagged template expression
function getTagName(node: TSESTree.TaggedTemplateExpression): string {
	if (node.tag.type === AST_NODE_TYPES.Identifier) {
		return node.tag.name;
	}
	if (node.tag.type === AST_NODE_TYPES.MemberExpression) {
		const parts: string[] = [];
		let current: TSESTree.Expression = node.tag;
		while (current.type === AST_NODE_TYPES.MemberExpression) {
			if (current.property.type === AST_NODE_TYPES.Identifier) {
				parts.unshift(current.property.name);
			}
			current = current.object;
		}
		if (current.type === AST_NODE_TYPES.Identifier) {
			parts.unshift(current.name);
		}
		return parts.join('.');
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
					checkStringLiterals: {
						oneOf: [
							{ type: 'boolean' },
							{
								type: 'object',
								properties: {
									onlyFunctions: {
										type: 'array',
										items: { type: 'string' },
									},
								},
								additionalProperties: false,
							},
						],
					},
					checkTemplateLiterals: {
						oneOf: [
							{ type: 'boolean' },
							{
								type: 'object',
								properties: {
									tags: {
										type: 'array',
										items: { type: 'string' },
									},
									untagged: { type: 'boolean' },
								},
								additionalProperties: false,
							},
						],
					},
					checkAttributes: {
						oneOf: [
							{ type: 'boolean' },
							{
								type: 'object',
								properties: {
									onlyAttributes: {
										type: 'array',
										items: { type: 'string' },
									},
								},
								additionalProperties: false,
							},
						],
					},
					checkChildren: {
						oneOf: [
							{ type: 'boolean' },
							{
								type: 'object',
								properties: {
									onlyComponents: {
										type: 'array',
										items: { type: 'string' },
									},
								},
								additionalProperties: false,
							},
						],
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
			// Replacement type toggles (all default to true)
			ellipsis: checkEllipsis = true,
			emdash: checkEmdash = true,
			endash: checkEndash = true,
			quotes: checkQuotes = true,
			apostrophes: checkApostrophes = true,
			primes: checkPrimes = true,
			// Scope options with defaults
			checkStringLiterals = false,
			checkTemplateLiterals = false,
			checkAttributes = { onlyAttributes: DEFAULT_CHECKED_ATTRIBUTES },
			checkChildren = true,
		} = options;

		// Track JSX element context
		const jsxElementStack: string[] = [];

		// Get the immediate parent element name
		function getCurrentElementName(): string | null {
			return jsxElementStack.length > 0 ? jsxElementStack[jsxElementStack.length - 1] : null;
		}

		// Check if we should check JSX children based on checkChildren option
		function shouldCheckChildren(): boolean {
			if (checkChildren === false) return false;
			if (checkChildren === true) return true;

			// { onlyComponents: [...] }
			const currentElement = getCurrentElementName();
			if (!currentElement) return false;

			const allowedComponents = checkChildren.onlyComponents;
			return (
				allowedComponents.includes(currentElement) ||
				allowedComponents.includes(currentElement.toLowerCase())
			);
		}

		// Check if we should check an attribute based on checkAttributes option
		function shouldCheckAttribute(attrName: string): boolean {
			if (checkAttributes === false) return false;
			if (checkAttributes === true) return true;

			// { onlyAttributes: [...] }
			return checkAttributes.onlyAttributes.includes(attrName);
		}

		// Check if we should check a string literal based on checkStringLiterals option and context
		function shouldCheckStringLiteral(node: TSESTree.Literal): boolean {
			if (checkStringLiterals === false) return false;
			if (checkStringLiterals === true) return true;

			// { onlyFunctions: [...] }
			const allowedFunctions = checkStringLiterals.onlyFunctions;
			return isInsideAllowedFunction(node, allowedFunctions);
		}

		// Check if a node is inside an allowed function call
		function isInsideAllowedFunction(node: TSESTree.Node, allowedFunctions: string[]): boolean {
			let current: TSESTree.Node | undefined = node.parent;
			while (current) {
				if (current.type === AST_NODE_TYPES.CallExpression) {
					const calleeName = getCalleeName(current);
					if (calleeName && allowedFunctions.includes(calleeName)) {
						return true;
					}
				}
				current = current.parent;
			}
			return false;
		}

		// Check if we should check a template literal based on checkTemplateLiterals option
		function shouldCheckTemplateLiteral(node: TSESTree.TemplateElement): boolean {
			if (checkTemplateLiterals === false) return false;
			if (checkTemplateLiterals === true) return true;

			// { tags?: [...], untagged?: boolean }
			const parent = node.parent;
			if (!parent) return false;

			// Check if it's a tagged template
			if (parent.type === AST_NODE_TYPES.TemplateLiteral && parent.parent) {
				if (parent.parent.type === AST_NODE_TYPES.TaggedTemplateExpression) {
					// It's tagged - check if tag is in allowed list
					const tagName = getTagName(parent.parent);
					return checkTemplateLiterals.tags?.includes(tagName) ?? false;
				} else {
					// It's untagged
					return checkTemplateLiterals.untagged ?? false;
				}
			}

			return false;
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
			if (checkQuotes || checkApostrophes || checkPrimes) {
				// Process double quotes
				if (checkQuotes) {
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
					} else if (isYearAbbrev) {
						if (checkApostrophes) {
							replacements.push({
								messageId: 'preferApostrophe',
								start: baseOffset + pos,
								end: baseOffset + pos + 1,
								replacement: CHARS.RIGHT_SINGLE,
							});
						}
					} else if (isPrime) {
						// It's a prime (after a digit) - only report if primes are enabled
						if (checkPrimes) {
							replacements.push({
								messageId: 'preferPrime',
								start: baseOffset + pos,
								end: baseOffset + pos + 1,
								replacement: CHARS.PRIME,
							});
						}
						// Skip - don't treat as quote even if primes disabled
					} else if (checkQuotes) {
						// It's a quote - determine opening vs closing
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
						const quotePos = primeMatch.index + 1;
						const existingIdx = replacements.findIndex(
							(r) =>
								r.start === baseOffset + quotePos && r.messageId === 'preferQuotes',
						);
						if (existingIdx !== -1) {
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
			// Track JSX element context
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

				// Check based on checkStringLiterals option
				if (!shouldCheckStringLiteral(node)) return;

				// The range includes quotes, so offset by 1
				checkText(node, node.value, node.range[0] + 1);
			},

			// Check template literal quasi elements
			TemplateElement(node) {
				// Check based on checkTemplateLiterals option
				if (!shouldCheckTemplateLiteral(node)) return;

				const text = node.value.raw;
				checkText(node, text, node.range[0] + 1);
			},

			// Check JSX text (respecting checkChildren option)
			JSXText(node) {
				if (!shouldCheckChildren()) return;
				checkText(node, node.value, node.range[0]);
			},

			// Check JSX attribute values (based on checkAttributes option)
			JSXAttribute(node) {
				// Get attribute name
				const attrName =
					node.name.type === AST_NODE_TYPES.JSXIdentifier
						? node.name.name
						: node.name.type === AST_NODE_TYPES.JSXNamespacedName
							? `${node.name.namespace.name}:${node.name.name.name}`
							: '';

				// Check if this attribute should be checked
				if (!shouldCheckAttribute(attrName)) return;

				// Check the value if it's a string literal
				if (
					node.value?.type === AST_NODE_TYPES.Literal &&
					typeof node.value.value === 'string'
				) {
					checkText(node.value, node.value.value, node.value.range[0] + 1);
				}
			},
		};
	},
};

export default rule;
