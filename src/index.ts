import preferUnicode from './rules/prefer-unicode.js';

const plugin = {
    meta: {
        name: 'eslint-plugin-unicode-typography',
        version: '1.0.0',
    },
    rules: {
        'prefer-unicode': preferUnicode,
    },
    configs: {},
};

// Add recommended config after plugin is defined (self-reference)
plugin.configs = {
    recommended: {
        plugins: {
            'unicode-typography': plugin,
        },
        rules: {
            'unicode-typography/prefer-unicode': 'warn',
        },
    },
};

export default plugin;
