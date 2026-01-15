/** @type {import('jest').Config} */
module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['**/tests/**/*.test.ts'],
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
	extensionsToTreatAsEsm: ['.ts'],
	moduleNameMapper: {
		'^(\\.{1,2}/.*)\\.js$': '$1',
	},
};
