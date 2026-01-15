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

// Extend RuleTesterConfig with flat config languageOptions (types lag behind implementation)
interface FlatConfigRuleTesterConfig extends RuleTesterConfig {
	languageOptions?: {
		parser?: typeof parser;
		parserOptions?: {
			ecmaFeatures?: { jsx?: boolean };
			ecmaVersion?: number;
			sourceType?: 'module' | 'script';
		};
	};
}

const config: FlatConfigRuleTesterConfig = {
	languageOptions: {
		parser,
		parserOptions: {
			ecmaFeatures: { jsx: true },
			ecmaVersion: 2020,
			sourceType: 'module',
		},
	},
};

const ruleTester = new RuleTester(config);

ruleTester.run('prefer-unicode', rule, {
	valid: [
		// ============================================
		// Already using correct Unicode characters
		// ============================================

		// Ellipsis already correct
		`const x = "hello${ELLIPSIS}"`,
		`<p>hello${ELLIPSIS}</p>`,

		// Em dash already correct
		`const x = "hello${EMDASH}world"`,
		`<p>hello${EMDASH}world</p>`,

		// En dash already correct
		`const x = "9am${ENDASH}5pm"`,
		`<p>Monday${ENDASH}Friday</p>`,

		// Smart double quotes already correct
		`const x = "${LEFT_DOUBLE}Hello${RIGHT_DOUBLE}"`,
		`<p>${LEFT_DOUBLE}quoted${RIGHT_DOUBLE}</p>`,

		// Smart single quotes already correct
		`const x = "${LEFT_SINGLE}quoted${RIGHT_SINGLE}"`,
		`<p>${LEFT_SINGLE}quoted${RIGHT_SINGLE}</p>`,

		// Apostrophe already correct
		`const x = "don${RIGHT_SINGLE}t"`,
		`<p>I${RIGHT_SINGLE}m here</p>`,

		// Primes already correct
		`const x = "5${PRIME} 6${DOUBLE_PRIME}"`,

		// ============================================
		// Exempt JSX elements (code, pre by default)
		// ============================================
		'<code>hello...</code>',
		'<pre>foo -- bar</pre>',
		'<code>const x = "test"</code>',
		`<pre>don't touch this</pre>`,

		// Nested content in exempt elements
		'<code><span>hello...</span></code>',
		'<pre><div>foo -- bar</div></pre>',

		// ============================================
		// Code-like JSX attributes (should NOT trigger)
		// ============================================
		'<div className="foo--bar"></div>',
		'<div className="block__element--modifier"></div>',
		'<div id="item-1"></div>',
		'<a href="http://example.com/path--test"></a>',
		'<img src="/images/icon--large.png" />',
		'<div style={{ color: "red" }}></div>',
		'<div data-testid="test--component"></div>',
		'<div key="item--1"></div>',

		// ============================================
		// Hyphenated words (should NOT trigger endash)
		// ============================================
		'const x = "red-tailed hawk"',
		'<p>This is a well-known fact</p>',
		'const x = "self-aware"',
		'<p>high-quality product</p>',
		'const msg = "up-to-date information"',

		// ============================================
		// Disabled via options
		// ============================================
		{
			code: 'const x = "hello..."',
			options: [{ ellipsis: false }],
		},
		{
			code: 'const x = "hello--world"',
			options: [{ emdash: false }],
		},
		{
			code: 'const x = "9am - 5pm"',
			options: [{ endash: false }],
		},
		{
			code: 'const x = \'"quoted"\'',
			options: [{ quotes: false }],
		},
		{
			code: 'const x = "don\'t"',
			options: [{ apostrophes: false }],
		},

		// ============================================
		// Custom exempt elements
		// ============================================
		{
			code: '<kbd>hello...</kbd>',
			options: [{ exemptElements: ['code', 'pre', 'kbd'] }],
		},
		{
			code: '<samp>foo -- bar</samp>',
			options: [{ exemptElements: ['code', 'pre', 'samp'] }],
		},
	],

	invalid: [
		// ============================================
		// Ellipsis: ... -> …
		// ============================================
		{
			code: 'const x = "hello..."',
			output: `const x = "hello${ELLIPSIS}"`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<p>hello...</p>',
			output: `<p>hello${ELLIPSIS}</p>`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'const x = "wait for it..."',
			output: `const x = "wait for it${ELLIPSIS}"`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<span>Loading...</span>',
			output: `<span>Loading${ELLIPSIS}</span>`,
			errors: [{ messageId: 'preferEllipsis' }],
		},

		// ============================================
		// Em dash: -- -> —
		// ============================================
		{
			code: 'const x = "hello--world"',
			output: `const x = "hello${EMDASH}world"`,
			errors: [{ messageId: 'preferEmdash' }],
		},
		{
			code: '<p>hello--world</p>',
			output: `<p>hello${EMDASH}world</p>`,
			errors: [{ messageId: 'preferEmdash' }],
		},
		{
			code: 'const x = "and then--suddenly--it happened"',
			output: `const x = "and then${EMDASH}suddenly${EMDASH}it happened"`,
			errors: [{ messageId: 'preferEmdash' }, { messageId: 'preferEmdash' }],
		},

		// ============================================
		// En dash: " - " -> – (spaces removed)
		// ============================================
		{
			code: 'const x = "9am - 5pm"',
			output: `const x = "9am${ENDASH}5pm"`,
			errors: [{ messageId: 'preferEndash' }],
		},
		{
			code: '<p>Monday - Friday</p>',
			output: `<p>Monday${ENDASH}Friday</p>`,
			errors: [{ messageId: 'preferEndash' }],
		},
		{
			code: 'const x = "pages 10 - 20"',
			output: `const x = "pages 10${ENDASH}20"`,
			errors: [{ messageId: 'preferEndash' }],
		},
		{
			code: '<span>New York - Los Angeles</span>',
			output: `<span>New York${ENDASH}Los Angeles</span>`,
			errors: [{ messageId: 'preferEndash' }],
		},

		// ============================================
		// Smart double quotes: "..." -> "..."
		// ============================================
		{
			code: 'const x = \'"Hello," she said\'',
			output: `const x = '${LEFT_DOUBLE}Hello,${RIGHT_DOUBLE} she said'`,
			errors: [{ messageId: 'preferQuotes' }, { messageId: 'preferQuotes' }],
		},
		{
			code: '<p>"quoted"</p>',
			output: `<p>${LEFT_DOUBLE}quoted${RIGHT_DOUBLE}</p>`,
			errors: [{ messageId: 'preferQuotes' }, { messageId: 'preferQuotes' }],
		},
		{
			code: 'const x = \'She said "hello" to me\'',
			output: `const x = 'She said ${LEFT_DOUBLE}hello${RIGHT_DOUBLE} to me'`,
			errors: [{ messageId: 'preferQuotes' }, { messageId: 'preferQuotes' }],
		},

		// ============================================
		// Smart single quotes: '...' -> '...'
		// ============================================
		{
			code: 'const x = "\'quoted\'"',
			output: `const x = "${LEFT_SINGLE}quoted${RIGHT_SINGLE}"`,
			errors: [{ messageId: 'preferQuotes' }, { messageId: 'preferQuotes' }],
		},
		{
			code: "<p>'quoted'</p>",
			output: `<p>${LEFT_SINGLE}quoted${RIGHT_SINGLE}</p>`,
			errors: [{ messageId: 'preferQuotes' }, { messageId: 'preferQuotes' }],
		},

		// ============================================
		// Apostrophes in contractions: ' -> '
		// ============================================
		{
			code: 'const x = "don\'t"',
			output: `const x = "don${RIGHT_SINGLE}t"`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: "<p>I'm here</p>",
			output: `<p>I${RIGHT_SINGLE}m here</p>`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: 'const x = "it\'s working"',
			output: `const x = "it${RIGHT_SINGLE}s working"`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: "<p>they're coming</p>",
			output: `<p>they${RIGHT_SINGLE}re coming</p>`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: 'const x = "wouldn\'t"',
			output: `const x = "wouldn${RIGHT_SINGLE}t"`,
			errors: [{ messageId: 'preferApostrophe' }],
		},

		// ============================================
		// Year abbreviations: '99 -> '99
		// ============================================
		{
			code: 'const x = "class of \'99"',
			output: `const x = "class of ${RIGHT_SINGLE}99"`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: "<p>back in '85</p>",
			output: `<p>back in ${RIGHT_SINGLE}85</p>`,
			errors: [{ messageId: 'preferApostrophe' }],
		},

		// ============================================
		// Primes for measurements: ' " -> ′ ″
		// ============================================
		{
			code: 'const height = "5\' tall"',
			output: `const height = "5${PRIME} tall"`,
			errors: [{ messageId: 'preferPrime' }],
		},
		{
			code: "<p>The room is 10' x 12'</p>",
			output: `<p>The room is 10${PRIME} x 12${PRIME}</p>`,
			errors: [{ messageId: 'preferPrime' }, { messageId: 'preferPrime' }],
		},

		// ============================================
		// Template literals
		// ============================================
		{
			code: 'const x = `hello...`',
			output: `const x = \`hello${ELLIPSIS}\``,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: 'const x = `hello--world`',
			output: `const x = \`hello${EMDASH}world\``,
			errors: [{ messageId: 'preferEmdash' }],
		},

		// ============================================
		// JSX attribute values (non-code-like)
		// ============================================
		{
			code: '<div title="hello..."></div>',
			output: `<div title="hello${ELLIPSIS}"></div>`,
			errors: [{ messageId: 'preferEllipsis' }],
		},
		{
			code: '<div aria-label="9am - 5pm"></div>',
			output: `<div aria-label="9am${ENDASH}5pm"></div>`,
			errors: [{ messageId: 'preferEndash' }],
		},
		{
			code: '<button title="Click here...">Go</button>',
			output: `<button title="Click here${ELLIPSIS}">Go</button>`,
			errors: [{ messageId: 'preferEllipsis' }],
		},

		// ============================================
		// Multiple issues in one string
		// ============================================
		{
			code: 'const x = "hello... world -- now"',
			output: `const x = "hello${ELLIPSIS} world ${EMDASH} now"`,
			errors: [{ messageId: 'preferEllipsis' }, { messageId: 'preferEmdash' }],
		},
		{
			code: "<p>Wait... and I'm here</p>",
			output: `<p>Wait${ELLIPSIS} and I${RIGHT_SINGLE}m here</p>`,
			errors: [{ messageId: 'preferEllipsis' }, { messageId: 'preferApostrophe' }],
		},

		// ============================================
		// Possessives: 's -> 's
		// ============================================
		{
			code: 'const x = "John\'s book"',
			output: `const x = "John${RIGHT_SINGLE}s book"`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
		{
			code: "<p>the dog's tail</p>",
			output: `<p>the dog${RIGHT_SINGLE}s tail</p>`,
			errors: [{ messageId: 'preferApostrophe' }],
		},
	],
});
