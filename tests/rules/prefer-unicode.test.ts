import { RuleTester } from '@typescript-eslint/rule-tester';
import type { RuleTesterConfig } from '@typescript-eslint/rule-tester';
import * as parser from '@typescript-eslint/parser';
import rule from '../../src/rules/prefer-unicode.js';

// Configure RuleTester to work with Jest
RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

// Unicode character constants for clarity
const ELLIPSIS = '\u2026'; // …
const EMDASH = '\u2014'; // —
const ENDASH = '\u2013'; // –
const LEFT_DOUBLE = '\u201C'; // “
const RIGHT_DOUBLE = '\u201D'; // ”
const LEFT_SINGLE = '\u2018'; // ‘
const RIGHT_SINGLE = '\u2019'; // ’ (also used for apostrophe)
const PRIME = '\u2032'; // ′
const DOUBLE_PRIME = '\u2033'; // ″

const ruleTester = new RuleTester({
	languageOptions: {
		parser,
		parserOptions: {
			ecmaFeatures: { jsx: true },
			ecmaVersion: 2020,
			sourceType: 'module',
		},
	},
} as RuleTesterConfig);

// ============================================
// DEFAULT BEHAVIOR TESTS
// checkStringLiterals: false (default)
// checkTemplateLiterals: false (default)
// checkAttributes: { onlyAttributes: ['title', 'alt', 'label', 'aria-label', 'aria-describedby'] } (default)
// checkChildren: true (default)
// ============================================
ruleTester.run('prefer-unicode (defaults)', rule, {
	valid: [
		// ============================================
		// String literals NOT checked by default
		// ============================================
		'const x = "hello..."',
		'const x = "hello--world"',
		'const x = "9am - 5pm"',
		'const x = "don\'t"',
		'const x = \'"quoted"\'',
		'const x = "5\' 6\\""',

		// ============================================
		// Template literals NOT checked by default
		// ============================================
		'const x = `hello...`',
		'const x = `hello--world`',
		'const x = `9am - 5pm`',
		'const x = css`content: "..."`',
		'const x = html`<p>hello...</p>`',

		// ============================================
		// JSX attributes NOT in default allowlist
		// ============================================
		'<div className="foo--bar"></div>',
		'<div id="item--test"></div>',
		'<a href="http://example.com/path--test"></a>',
		'<img src="/images/icon--large.png" />',
		'<div data-testid="test--component"></div>',
		'<div key="item--1"></div>',
		'<div data-value="hello..."></div>',
		'<div custom-attr="hello..."></div>',
		'<div placeholder="Loading..."></div>',

		// ============================================
		// Already using correct Unicode characters
		// ============================================
		`<p>hello${ELLIPSIS}</p>`,
		`<p>hello${EMDASH}world</p>`,
		`<p>Monday${ENDASH}Friday</p>`,
		`<p>${LEFT_DOUBLE}quoted${RIGHT_DOUBLE}</p>`,
		`<p>${LEFT_SINGLE}quoted${RIGHT_SINGLE}</p>`,
		`<p>I${RIGHT_SINGLE}m here</p>`,

		// ============================================
		// Hyphenated words in JSX children (no endash)
		// ============================================
		'<p>This is a well-known fact</p>',
		'<p>high-quality product</p>',
		'<p>up-to-date information</p>',
	],
	invalid: [
		// ============================================
		// JSX children ARE checked by default
		// ============================================
		{
			code: '<p>hello...</p>',
			output: `<p>hello${ELLIPSIS}</p>`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<span>Loading...</span>',
			output: `<span>Loading${ELLIPSIS}</span>`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<p>hello--world</p>',
			output: `<p>hello${EMDASH}world</p>`,
			errors: [{ messageId: 'preferEmdash' }],
		},
		{
			code: '<p>Monday - Friday</p>',
			output: `<p>Monday${ENDASH}Friday</p>`,
			errors: [{ messageId: 'preferEndash' }],
		},
		{
			code: '<p>"quoted"</p>',
			output: `<p>${LEFT_DOUBLE}quoted${RIGHT_DOUBLE}</p>`,
			errors: [{ messageId: 'preferQuotes' }, { messageId: 'preferQuotes' }],
		},
		{
			code: "<p>'quoted'</p>",
			output: `<p>${LEFT_SINGLE}quoted${RIGHT_SINGLE}</p>`,
			errors: [{ messageId: 'preferQuotes' }, { messageId: 'preferQuotes' }],
		},
		{
			code: "<p>I'm here</p>",
			output: `<p>I${RIGHT_SINGLE}m here</p>`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: "<p>they're coming</p>",
			output: `<p>they${RIGHT_SINGLE}re coming</p>`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: "<p>back in '85</p>",
			output: `<p>back in ${RIGHT_SINGLE}85</p>`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: "<p>The room is 10' x 12'</p>",
			output: `<p>The room is 10${PRIME} x 12${PRIME}</p>`,
			errors: [{ messageId: 'preferPrime' }, { messageId: 'preferPrime' }],
		},
		{
			code: '<p>He is 5\' 6" tall</p>',
			output: `<p>He is 5${PRIME} 6${DOUBLE_PRIME} tall</p>`,
			errors: [{ messageId: 'preferPrime' }, { messageId: 'preferPrime' }],
		},
		// Multiple issues in JSX children
		{
			code: "<p>Wait... and I'm here</p>",
			output: `<p>Wait${ELLIPSIS} and I${RIGHT_SINGLE}m here</p>`,
			errors: [{ messageId: 'preferEllipsis' }, { messageId: 'preferApostrophe' }],
		},

		// ============================================
		// Default allowlist attributes ARE checked
		// ============================================
		{
			code: '<div title="hello..."></div>',
			output: `<div title="hello${ELLIPSIS}"></div>`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<img alt="Loading..." />',
			output: `<img alt="Loading${ELLIPSIS}" />`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<input label="Enter name..." />',
			output: `<input label="Enter name${ELLIPSIS}" />`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<div aria-label="9am - 5pm"></div>',
			output: `<div aria-label="9am${ENDASH}5pm"></div>`,
			errors: [{ messageId: 'preferEndash' }],
		},
		{
			code: '<div aria-describedby="hello..."></div>',
			output: `<div aria-describedby="hello${ELLIPSIS}"></div>`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
	],
});

// ============================================
// checkStringLiterals OPTION TESTS
// ============================================
ruleTester.run('prefer-unicode (checkStringLiterals)', rule, {
	valid: [
		// checkStringLiterals: false (explicit) - no string literals checked
		{
			code: 'const x = "hello..."',
			options: [{ checkStringLiterals: false }],
		},

		// checkStringLiterals: true - already correct
		{
			code: `const x = "hello${ELLIPSIS}"`,
			options: [{ checkStringLiterals: true }],
		},

		// checkStringLiterals: { onlyFunctions } - outside specified functions
		{
			code: 'const x = "hello..."',
			options: [{ checkStringLiterals: { onlyFunctions: ['t', 'msg'] } }],
		},
		{
			code: 'other("hello...")',
			options: [{ checkStringLiterals: { onlyFunctions: ['t', 'msg'] } }],
		},
		{
			code: 'console.log("hello...")',
			options: [{ checkStringLiterals: { onlyFunctions: ['t'] } }],
		},
		// Method call not in list
		{
			code: 'i18n.t("hello...")',
			options: [{ checkStringLiterals: { onlyFunctions: ['msg'] } }],
		},
	],
	invalid: [
		// checkStringLiterals: true - check all string literals
		{
			code: 'const x = "hello..."',
			output: `const x = "hello${ELLIPSIS}"`,
			options: [{ checkStringLiterals: true }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'const x = "hello--world"',
			output: `const x = "hello${EMDASH}world"`,
			options: [{ checkStringLiterals: true }],
			errors: [{ messageId: 'preferEmdash' }],
		},
		{
			code: 'const x = "9am - 5pm"',
			output: `const x = "9am${ENDASH}5pm"`,
			options: [{ checkStringLiterals: true }],
			errors: [{ messageId: 'preferEndash' }],
		},
		{
			code: 'const x = "don\'t"',
			output: `const x = "don${RIGHT_SINGLE}t"`,
			options: [{ checkStringLiterals: true }],
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: 'const x = \'"Hello," she said\'',
			output: `const x = '${LEFT_DOUBLE}Hello,${RIGHT_DOUBLE} she said'`,
			options: [{ checkStringLiterals: true }],
			errors: [{ messageId: 'preferQuotes' }, { messageId: 'preferQuotes' }],
		},
		{
			code: 'const x = "class of \'99"',
			output: `const x = "class of ${RIGHT_SINGLE}99"`,
			options: [{ checkStringLiterals: true }],
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: 'const height = "5\' tall"',
			output: `const height = "5${PRIME} tall"`,
			options: [{ checkStringLiterals: true }],
			errors: [{ messageId: 'preferPrime' }],
		},

		// checkStringLiterals: { onlyFunctions } - inside specified functions
		{
			code: 't("hello...")',
			output: `t("hello${ELLIPSIS}")`,
			options: [{ checkStringLiterals: { onlyFunctions: ['t', 'msg'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'msg("Loading...")',
			output: `msg("Loading${ELLIPSIS}")`,
			options: [{ checkStringLiterals: { onlyFunctions: ['t', 'msg'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 't("9am - 5pm")',
			output: `t("9am${ENDASH}5pm")`,
			options: [{ checkStringLiterals: { onlyFunctions: ['t'] } }],
			errors: [{ messageId: 'preferEndash' }],
		},
		// Multiple arguments - all checked
		{
			code: 't("key", "hello...")',
			output: `t("key", "hello${ELLIPSIS}")`,
			options: [{ checkStringLiterals: { onlyFunctions: ['t'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		// Method call syntax: i18n.t("...")
		{
			code: 'i18n.t("hello...")',
			output: `i18n.t("hello${ELLIPSIS}")`,
			options: [{ checkStringLiterals: { onlyFunctions: ['i18n.t'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		// Nested function calls - inner function matches
		{
			code: 'console.log(t("hello..."))',
			output: `console.log(t("hello${ELLIPSIS}"))`,
			options: [{ checkStringLiterals: { onlyFunctions: ['t'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
	],
});

// ============================================
// checkTemplateLiterals OPTION TESTS
// ============================================
ruleTester.run('prefer-unicode (checkTemplateLiterals)', rule, {
	valid: [
		// checkTemplateLiterals: false (default/explicit) - no templates checked
		{
			code: 'const x = `hello...`',
			options: [{ checkTemplateLiterals: false }],
		},
		{
			code: 'const x = css`content: "..."`',
			options: [{ checkTemplateLiterals: false }],
		},

		// checkTemplateLiterals: true - already correct
		{
			code: `const x = \`hello${ELLIPSIS}\``,
			options: [{ checkTemplateLiterals: true }],
		},

		// checkTemplateLiterals: { untagged: false } - untagged not checked
		{
			code: 'const x = `hello...`',
			options: [{ checkTemplateLiterals: { untagged: false } }],
		},

		// checkTemplateLiterals: { tags: ['t'] } - other tags not checked
		{
			code: 'const x = css`hello...`',
			options: [{ checkTemplateLiterals: { tags: ['t'] } }],
		},
		{
			code: 'const x = html`<p>hello...</p>`',
			options: [{ checkTemplateLiterals: { tags: ['t'] } }],
		},

		// checkTemplateLiterals: { untagged: true } - tagged not checked
		{
			code: 'const x = css`hello...`',
			options: [{ checkTemplateLiterals: { untagged: true } }],
		},
	],
	invalid: [
		// checkTemplateLiterals: true - check all templates
		{
			code: 'const x = `hello...`',
			output: `const x = \`hello${ELLIPSIS}\``,
			options: [{ checkTemplateLiterals: true }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'const x = `hello--world`',
			output: `const x = \`hello${EMDASH}world\``,
			options: [{ checkTemplateLiterals: true }],
			errors: [{ messageId: 'preferEmdash' }],
		},
		// Tagged template with ellipsis (quotes disabled to avoid overlapping fix issues)
		{
			code: 'const x = css`content: "hello..."`',
			output: `const x = css\`content: "hello${ELLIPSIS}"\``,
			options: [{ checkTemplateLiterals: true, quotes: false }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'const x = html`<p>hello...</p>`',
			output: `const x = html\`<p>hello${ELLIPSIS}</p>\``,
			options: [{ checkTemplateLiterals: true }],
			errors: [{ messageId: 'preferEllipsis' }],
		},

		// checkTemplateLiterals: { untagged: true } - check untagged only
		{
			code: 'const x = `hello...`',
			output: `const x = \`hello${ELLIPSIS}\``,
			options: [{ checkTemplateLiterals: { untagged: true } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},

		// checkTemplateLiterals: { tags: ['t', 'msg'] } - check specific tags
		{
			code: 'const x = t`hello...`',
			output: `const x = t\`hello${ELLIPSIS}\``,
			options: [{ checkTemplateLiterals: { tags: ['t', 'msg'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'const x = msg`Loading...`',
			output: `const x = msg\`Loading${ELLIPSIS}\``,
			options: [{ checkTemplateLiterals: { tags: ['t', 'msg'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'const x = i18n`9am - 5pm`',
			output: `const x = i18n\`9am${ENDASH}5pm\``,
			options: [{ checkTemplateLiterals: { tags: ['i18n'] } }],
			errors: [{ messageId: 'preferEndash' }],
		},

		// checkTemplateLiterals: { tags: ['t'], untagged: true } - both
		{
			code: 'const x = `hello...`',
			output: `const x = \`hello${ELLIPSIS}\``,
			options: [{ checkTemplateLiterals: { tags: ['t'], untagged: true } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'const x = t`hello...`',
			output: `const x = t\`hello${ELLIPSIS}\``,
			options: [{ checkTemplateLiterals: { tags: ['t'], untagged: true } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
	],
});

// ============================================
// checkAttributes OPTION TESTS
// ============================================
ruleTester.run('prefer-unicode (checkAttributes)', rule, {
	valid: [
		// checkAttributes: false - no attributes checked
		{
			code: '<div title="hello..."></div>',
			options: [{ checkAttributes: false }],
		},
		{
			code: '<div aria-label="hello..."></div>',
			options: [{ checkAttributes: false }],
		},

		// checkAttributes: true - already correct
		{
			code: `<div title="hello${ELLIPSIS}"></div>`,
			options: [{ checkAttributes: true }],
		},

		// checkAttributes: { onlyAttributes } - other attributes not checked
		{
			code: '<div title="hello..."></div>',
			options: [{ checkAttributes: { onlyAttributes: ['alt'] } }],
		},
		{
			code: '<div className="foo--bar"></div>',
			options: [{ checkAttributes: { onlyAttributes: ['title', 'alt'] } }],
		},
	],
	invalid: [
		// checkAttributes: true - check all attributes
		{
			code: '<div title="hello..."></div>',
			output: `<div title="hello${ELLIPSIS}"></div>`,
			options: [{ checkAttributes: true }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<div className="foo--bar"></div>',
			output: `<div className="foo${EMDASH}bar"></div>`,
			options: [{ checkAttributes: true }],
			errors: [{ messageId: 'preferEmdash' }],
		},
		{
			code: '<div data-value="hello..."></div>',
			output: `<div data-value="hello${ELLIPSIS}"></div>`,
			options: [{ checkAttributes: true }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<div custom-attr="9am - 5pm"></div>',
			output: `<div custom-attr="9am${ENDASH}5pm"></div>`,
			options: [{ checkAttributes: true }],
			errors: [{ messageId: 'preferEndash' }],
		},

		// checkAttributes: { onlyAttributes } - check specific attributes
		{
			code: '<div placeholder="Loading..."></div>',
			output: `<div placeholder="Loading${ELLIPSIS}"></div>`,
			options: [{ checkAttributes: { onlyAttributes: ['placeholder'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<div data-hint="hello..."></div>',
			output: `<div data-hint="hello${ELLIPSIS}"></div>`,
			options: [{ checkAttributes: { onlyAttributes: ['data-hint', 'title'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
	],
});

// ============================================
// checkChildren OPTION TESTS
// ============================================
ruleTester.run('prefer-unicode (checkChildren)', rule, {
	valid: [
		// checkChildren: false - no JSX text checked
		{
			code: '<p>hello...</p>',
			options: [{ checkChildren: false }],
		},
		{
			code: '<span>Loading...</span>',
			options: [{ checkChildren: false }],
		},

		// checkChildren: true (default) - already correct
		{
			code: `<p>hello${ELLIPSIS}</p>`,
			options: [{ checkChildren: true }],
		},

		// checkChildren: { onlyComponents } - other elements not checked
		{
			code: '<div>hello...</div>',
			options: [{ checkChildren: { onlyComponents: ['p', 'span'] } }],
		},
		{
			code: '<section>Loading...</section>',
			options: [{ checkChildren: { onlyComponents: ['p', 'span'] } }],
		},
		{
			code: '<article>hello...</article>',
			options: [{ checkChildren: { onlyComponents: ['p'] } }],
		},
		// Nested - parent not in list, child text not checked
		{
			code: '<div><span>hello...</span></div>',
			options: [{ checkChildren: { onlyComponents: ['p'] } }],
		},
	],
	invalid: [
		// checkChildren: true (default) - check all JSX text
		{
			code: '<p>hello...</p>',
			output: `<p>hello${ELLIPSIS}</p>`,
			options: [{ checkChildren: true }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<div>hello...</div>',
			output: `<div>hello${ELLIPSIS}</div>`,
			options: [{ checkChildren: true }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<CustomComponent>hello...</CustomComponent>',
			output: `<CustomComponent>hello${ELLIPSIS}</CustomComponent>`,
			options: [{ checkChildren: true }],
			errors: [{ messageId: 'preferEllipsis' }],
		},

		// checkChildren: { onlyComponents } - check specific components
		{
			code: '<p>hello...</p>',
			output: `<p>hello${ELLIPSIS}</p>`,
			options: [{ checkChildren: { onlyComponents: ['p', 'span'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<span>Loading...</span>',
			output: `<span>Loading${ELLIPSIS}</span>`,
			options: [{ checkChildren: { onlyComponents: ['p', 'span'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		// Nested - inner element in list
		{
			code: '<div><p>hello...</p></div>',
			output: `<div><p>hello${ELLIPSIS}</p></div>`,
			options: [{ checkChildren: { onlyComponents: ['p'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
		// Custom component
		{
			code: '<Text>hello...</Text>',
			output: `<Text>hello${ELLIPSIS}</Text>`,
			options: [{ checkChildren: { onlyComponents: ['Text', 'Label'] } }],
			errors: [{ messageId: 'preferEllipsis' }],
		},
	],
});

// ============================================
// REPLACEMENT TYPE OPTIONS (ellipsis, emdash, etc.)
// ============================================
ruleTester.run('prefer-unicode (replacement options)', rule, {
	valid: [
		// Disable specific replacement types
		{
			code: '<p>hello...</p>',
			options: [{ ellipsis: false }],
		},
		{
			code: '<p>hello--world</p>',
			options: [{ emdash: false }],
		},
		{
			code: '<p>9am - 5pm</p>',
			options: [{ endash: false }],
		},
		{
			code: '<p>"quoted"</p>',
			options: [{ quotes: false }],
		},
		{
			code: "<p>don't</p>",
			options: [{ apostrophes: false }],
		},
		{
			code: "<p>5' tall</p>",
			options: [{ primes: false }],
		},
	],
	invalid: [],
});

// ============================================
// COMBINED OPTIONS TESTS
// ============================================
ruleTester.run('prefer-unicode (combined options)', rule, {
	valid: [
		// All disabled
		{
			code: '<p>hello...</p>',
			options: [{ checkChildren: false, checkAttributes: false }],
		},
		// String literals enabled but JSX disabled
		{
			code: '<p>hello...</p>',
			options: [{ checkStringLiterals: true, checkChildren: false }],
		},
	],
	invalid: [
		// String literals enabled, JSX children enabled
		{
			code: 'const x = "hello..."; const y = <p>world...</p>',
			output: `const x = "hello${ELLIPSIS}"; const y = <p>world${ELLIPSIS}</p>`,
			options: [{ checkStringLiterals: true }],
			errors: [{ messageId: 'preferEllipsis' }, { messageId: 'preferEllipsis' }],
		},
		// Template literals enabled
		{
			code: 'const x = `hello...`; const y = <p>world...</p>',
			output: `const x = \`hello${ELLIPSIS}\`; const y = <p>world${ELLIPSIS}</p>`,
			options: [{ checkTemplateLiterals: true }],
			errors: [{ messageId: 'preferEllipsis' }, { messageId: 'preferEllipsis' }],
		},
		// Function-scoped strings + JSX
		{
			code: 't("hello..."); const y = <p>world...</p>',
			output: `t("hello${ELLIPSIS}"); const y = <p>world${ELLIPSIS}</p>`,
			options: [{ checkStringLiterals: { onlyFunctions: ['t'] } }],
			errors: [{ messageId: 'preferEllipsis' }, { messageId: 'preferEllipsis' }],
		},
	],
});
