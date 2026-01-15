# eslint-plugin-unicode-typography

ESLint plugin to enforce proper Unicode typography characters instead of ASCII approximations.

## Why?

Typography matters. Using proper Unicode characters instead of ASCII approximations makes your text more readable and professional:

| Instead of | Use |
|------------|-----|
| `...` | `…` (ellipsis) |
| `--` | `—` (em dash) |
| ` - ` | `–` (en dash) |
| `"quoted"` | `“quoted”` (smart quotes) |
| `'quoted'` | `‘quoted’` (smart quotes) |
| `don't` | `don’t` (smart apostrophe) |
| `5' 6"` | `5′ 6″` (prime symbols) |

## Installation

```bash
npm install eslint-plugin-unicode-typography --save-dev
# or
pnpm add -D eslint-plugin-unicode-typography
# or
yarn add -D eslint-plugin-unicode-typography
```

## Usage

### Flat Config (ESLint 9+)

```js
// eslint.config.js
import unicodeTypography from 'eslint-plugin-unicode-typography';

export default [
  // Use the recommended config
  unicodeTypography.configs.recommended,

  // Or configure manually
  {
    plugins: {
      'unicode-typography': unicodeTypography,
    },
    rules: {
      'unicode-typography/prefer-unicode': 'warn',
    },
  },
];
```

### Legacy Config (ESLint 7-8)

```json
{
  "plugins": ["unicode-typography"],
  "rules": {
    "unicode-typography/prefer-unicode": "warn"
  }
}
```

## Rule: `prefer-unicode`

Enforces the use of proper Unicode typography characters.

### Options

```js
{
  "unicode-typography/prefer-unicode": ["warn", {
    // Enable/disable specific replacements (all true by default)
    "ellipsis": true,      // ... → …
    "emdash": true,        // -- → —
    "endash": true,        // " - " → –
    "quotes": true,        // "" '' → "" ''
    "apostrophes": true,   // ' → ' (in contractions)
    "primes": true,        // ' " → ′ ″ (after numbers)

    // JSX elements to exempt from checking
    "exemptElements": ["code", "pre"]
  }]
}
```

### What Gets Checked

- String literals (`const x = "hello..."`)
- Template literals ("`hello...`")
- JSX text (`<p>hello...</p>`)
- JSX attribute values (`<div title="hello...">`)

### What Gets Skipped

- Content inside exempt JSX elements (`<code>`, `<pre>` by default)
- Code-like JSX attributes: `className`, `id`, `href`, `src`, `style`, `key`, `data-testid`
- Hyphenated words (`well-known`, `red-tailed`) - only ` - ` with spaces triggers en dash

### Exempt Elements

By default, content inside `<code>` and `<pre>` elements is not checked:

```jsx
// ✅ No warning - inside <code>
<code>const x = "hello...";</code>

// ✅ No warning - inside <pre>
<pre>
  function test() {
    return "foo--bar";
  }
</pre>
```

Configure additional exempt elements:

```js
{
  "unicode-typography/prefer-unicode": ["warn", {
    "exemptElements": ["code", "pre", "kbd", "samp"]
  }]
}
```

## Auto-fix

This rule provides auto-fix support. Run ESLint with `--fix` to automatically replace ASCII characters with their Unicode equivalents:

```bash
eslint --fix src/
```

## Related

- [smartquotes.js](https://github.com/kellym/smartquotes.js) - Inspiration for quote replacement logic

## License

MIT
