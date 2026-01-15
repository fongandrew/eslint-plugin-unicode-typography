import type { TSESLint } from '@typescript-eslint/utils';

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
            preferEllipsis:
                'Use ellipsis character (\u2026) instead of three dots (...)',
            preferEmdash:
                'Use em dash (\u2014) instead of double hyphen (--)',
            preferEndash:
                'Use en dash (\u2013) instead of spaced hyphen ( - )',
            preferQuotes:
                'Use smart quotes (\u201C\u201D or \u2018\u2019) instead of straight quotes',
            preferApostrophe:
                'Use smart apostrophe (\u2019) instead of straight apostrophe',
            preferPrime:
                'Use prime (\u2032) or double prime (\u2033) for measurements',
        },
    },
    create() {
        // Stub - returns empty listener object
        // Tests will fail until this is implemented
        return {};
    },
};

export default rule;
