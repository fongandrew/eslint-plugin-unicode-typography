# eslint-plugin-unicode-typography

ESLint plugin to enforce proper Unicode typography characters instead of ASCII approximations.

## Why?

Typography matters. Using proper Unicode characters instead of ASCII approximations makes your text more readable and professional:

| Instead of | Use |
|------------|-----|
| `...` | `…` (ellipsis) |
| `--` | `—` (em dash) |
| ` - ` | `–` (en dash, see below) |
| `"quoted"` | `“quoted”` (smart quotes) |
| `'quoted'` | `‘quoted’` (smart quotes) |
| `don't` | `don’t` (smart apostrophe) |
| `5' 6"` | `5′ 6″` (prime symbols) |

**Note:** The en dash rule specifically looks for a space on either side. Words like `well-known` and `red-tailed` should use a hyphen but something like `9am–5pm` should use an en dash.

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

### Default Behavior

By default, the rule checks:
- **JSX children** (text inside JSX elements) - all elements
- **JSX attributes** - only `title`, `alt`, `label`, `aria-label`, `aria-describedby`

By default, the rule does NOT check:
- **String literals** - disabled by default
- **Template literals** - disabled by default

### Options

```js
{
  "unicode-typography/prefer-unicode": ["warn", {
    // Replacement toggles (all true by default)
    "ellipsis": true,      // ... → …
    "emdash": true,        // -- → —
    "endash": true,        // " - " → –
    "quotes": true,        // "" '' → "" ''
    "apostrophes": true,   // ' → ' (in contractions)
    "primes": true,        // ' " → ′ ″ (after numbers)

    // Scope options (trinary: true | false | object)
    "checkStringLiterals": false,
    "checkTemplateLiterals": false,
    "checkAttributes": { "onlyAttributes": ["title", "alt", "label", "aria-label", "aria-describedby"] },
    "checkChildren": true
  }]
}
```

### Scope Options

Each scope option accepts three types of values:

#### `checkStringLiterals`

Controls checking of string literals in JavaScript/TypeScript.

```js
// Disable (default)
"checkStringLiterals": false

// Enable for all string literals
"checkStringLiterals": true

// Enable only inside specific function calls (e.g., i18n)
"checkStringLiterals": { "onlyFunctions": ["t", "msg", "i18n.t"] }
```

#### `checkTemplateLiterals`

Controls checking of template literals.

```js
// Disable (default)
"checkTemplateLiterals": false

// Enable for all template literals (tagged and untagged)
"checkTemplateLiterals": true

// Enable for specific tagged templates only
"checkTemplateLiterals": { "tags": ["t", "msg"] }

// Enable for untagged templates only
"checkTemplateLiterals": { "untagged": true }

// Enable for both specific tags and untagged
"checkTemplateLiterals": { "tags": ["t"], "untagged": true }
```

#### `checkAttributes`

Controls checking of JSX attribute values.

```js
// Disable
"checkAttributes": false

// Enable for all attributes
"checkAttributes": true

// Enable for specific attributes only (default)
"checkAttributes": { "onlyAttributes": ["title", "alt", "label", "aria-label", "aria-describedby"] }
```

#### `checkChildren`

Controls checking of JSX text content.

```js
// Disable
"checkChildren": false

// Enable for all elements (default)
"checkChildren": true

// Enable for specific elements/components only
"checkChildren": { "onlyComponents": ["p", "span", "Text", "Label"] }
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
