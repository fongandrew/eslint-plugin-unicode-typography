# CLAUDE.md

This file provides context for Claude Code when working on this project.

## Project Overview

ESLint plugin that enforces proper Unicode typography characters in JavaScript/TypeScript and JSX/TSX files. It replaces ASCII approximations with their proper Unicode equivalents.

## Tech Stack

- **Language**: TypeScript
- **Build**: `tsc` (TypeScript compiler)
- **Testing**: Jest with `@typescript-eslint/rule-tester`
- **Package Manager**: pnpm
- **Target**: ESLint 7+ (flat config compatible)

## Key Commands

```bash
pnpm build    # Compile TypeScript to dist/
pnpm test     # Run Jest tests
pnpm lint     # Run ESLint on src/
pnpm format   # Run Prettier on src/
```

## Project Structure

```
src/
├── index.ts                    # Plugin entry point, exports rules and configs
└── rules/
    └── prefer-unicode.ts       # Main rule implementation

tests/
└── rules/
    └── prefer-unicode.test.ts  # Test suite (73 tests)

dist/                           # Compiled output (gitignored except for publishing)
```

## Architecture

### Single Rule Design

The plugin uses a single rule (`unicode-typography/prefer-unicode`) with configurable options rather than multiple rules. This is more efficient (single AST traversal) and provides a cleaner API.

### AST Nodes Visited

- `Literal` - String literals in JS/TS
- `TemplateElement` - Template literal content
- `JSXText` - Text content in JSX elements
- `JSXAttribute` - Attribute values (filtered by attribute name)
- `JSXElement` - Used to track element context for exemptions

### Key Implementation Details

1. **JSX Element Exemption**: Uses a stack to track nested JSX elements. `JSXElement` enter/exit handlers push/pop element names to determine if content is inside exempt elements like `<code>` or `<pre>`.

2. **Quote Detection Logic**: Based on smartquotes.js patterns:
   - Apostrophes: Between word characters (`don't`)
   - Year abbreviations: After whitespace, before digits (`'99`)
   - Primes: After digits (`5'`, `6"`)
   - Opening quotes: After whitespace/punctuation/start
   - Closing quotes: Everything else

3. **Position Calculation**: Fixes use absolute positions from `node.range`. For string literals, offset by 1 to skip the opening quote character.

## Testing Notes

- Tests use `@typescript-eslint/rule-tester` with flat config format
- The `RuleTesterConfig` type doesn't include `languageOptions` yet, so we extend it with `FlatConfigRuleTesterConfig`
- Unicode constants are defined with `\uXXXX` escapes for clarity and to avoid tokenization issues
