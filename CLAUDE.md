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
    └── prefer-unicode.test.ts  # Test suite (117 tests)

dist/                           # Compiled output (gitignored except for publishing)
```

## Architecture

### Single Rule Design

The plugin uses a single rule (`unicode-typography/prefer-unicode`) with configurable options rather than multiple rules. This is more efficient (single AST traversal) and provides a cleaner API.

### Trinary Option Schema

The rule uses a trinary option pattern for scope controls:

```typescript
type CheckOption = boolean | { specificConfig: ... };

// Examples:
checkStringLiterals: false                           // Disabled (default)
checkStringLiterals: true                            // Check all
checkStringLiterals: { onlyFunctions: ['t', 'msg'] } // Check only inside these functions

checkTemplateLiterals: false                         // Disabled (default)
checkTemplateLiterals: true                          // Check all (tagged + untagged)
checkTemplateLiterals: { tags: ['t'], untagged: true } // Granular control

checkAttributes: false                               // Disabled
checkAttributes: true                                // Check all
checkAttributes: { onlyAttributes: ['title', 'alt'] } // Check specific (default has 5 attrs)

checkChildren: false                                 // Disabled
checkChildren: true                                  // Check all (default)
checkChildren: { onlyComponents: ['p', 'span'] }     // Check specific elements
```

### AST Nodes Visited

- `Literal` - String literals in JS/TS
- `TemplateElement` - Template literal content
- `JSXText` - Text content in JSX elements
- `JSXAttribute` - Attribute values (filtered by attribute name)
- `JSXElement` - Used to track element context for component filtering

### Key Implementation Details

1. **JSX Element Tracking**: Uses a stack to track nested JSX elements. `JSXElement` enter/exit handlers push/pop element names to determine the current element context.

2. **Function Call Detection**: For `checkStringLiterals: { onlyFunctions: [...] }`, walks up the AST parent chain to find enclosing CallExpression nodes and checks if the callee matches the allowed function names.

3. **Tagged Template Detection**: For `checkTemplateLiterals: { tags: [...] }`, checks if the parent TemplateLiteral is inside a TaggedTemplateExpression and extracts the tag name.

4. **Quote Detection Logic**: Based on smartquotes.js patterns:
   - Apostrophes: Between word characters (`don't`)
   - Year abbreviations: After whitespace, before digits (`'99`)
   - Primes: After digits (`5'`, `6"`) - skipped if primes disabled
   - Opening quotes: After whitespace/punctuation/start
   - Closing quotes: Everything else

5. **Position Calculation**: Fixes use absolute positions from `node.range`. For string literals and template elements, offset by 1 to skip the opening quote/backtick character.

## Default Behavior

- `checkStringLiterals`: false (disabled)
- `checkTemplateLiterals`: false (disabled)
- `checkAttributes`: `{ onlyAttributes: ['title', 'alt', 'label', 'aria-label', 'aria-describedby'] }`
- `checkChildren`: true (all JSX elements)

## Testing Notes

- Tests use `@typescript-eslint/rule-tester` with flat config format
- The `RuleTesterConfig` type doesn't include `languageOptions` yet, so we extend it with `FlatConfigRuleTesterConfig`
- Unicode constants are defined with `\uXXXX` escapes for clarity and to avoid tokenization issues
- Multiple overlapping fixes (e.g., quotes + ellipsis in same string) can have complex interactions - some tests disable specific replacements to isolate behavior
