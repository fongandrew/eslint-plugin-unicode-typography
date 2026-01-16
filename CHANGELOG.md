# Changelog

## [1.0.0] - 2025-01-15

### Added

- Initial release of `eslint-plugin-unicode-typography`
- Single rule `prefer-unicode` with auto-fix support
- Typography replacements:
  - `...` → `…` (ellipsis)
  - `--` → `—` (em dash)
  - ` - ` → `–` (en dash for ranges)
  - `"` `"` → `“` `”` (smart double quotes)
  - `'` `'` → `‘` `’` (smart single quotes)
  - `'` → `’` (apostrophes in contractions like `don't`)
  - `'` `"` → `′` `″` (prime symbols after numbers like `5' 6"`)
- Configurable scope options with trinary values (boolean or object):
  - `checkStringLiterals` - check JS/TS string literals
  - `checkTemplateLiterals` - check template literals (tagged/untagged)
  - `checkAttributes` - check JSX attribute values
  - `checkChildren` - check JSX text content
- Granular filtering:
  - `onlyFunctions` - limit string literal checks to specific function calls (e.g., i18n)
  - `tags` / `untagged` - control which template literals to check
  - `onlyAttributes` - limit attribute checks to specific attributes
  - `onlyComponents` - limit JSX children checks to specific elements
- Individual replacement toggles (`ellipsis`, `emdash`, `endash`, `quotes`, `apostrophes`, `primes`)
- ESLint flat config support (ESLint 9+)
- Legacy config support (ESLint 7-8)
- Recommended config preset
