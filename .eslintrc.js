module.exports = {
	env: {
		browser: true,
		es2021: true,
		'jest/globals': true,
		node: true
	},
	extends: [
		'plugin:react/recommended',
		'standard'
	],
	parserOptions: {
		ecmaFeatures: {
			jsx: true
		},
		ecmaVersion: 13,
		sourceType: 'module'
	},
	plugins: [ 'jest', 'react' ],
	rules: {
		'array-bracket-spacing': 0,
		'computed-property-spacing': [ 'error', 'always' ],
		'keyword-spacing': 0,
		'no-async-promise-executor': 0,
		'no-constant-condition': 0,
		'no-global-assign': 0,
		'no-labels': 0,
		'no-tabs': 0,
		'no-useless-escape': 0,
		'padded-blocks': 0,
		'react/prop-types': 0,
		'space-before-function-paren': [ 'error', {
			anonymous: 'always',
			asyncArrow: 'always',
			named: 'never'
		} ],
		'space-in-parens': 0,
		'template-curly-spacing': [ 'error', 'always' ],
		indent: [
			'error', 'tab', {
				SwitchCase: 1
			}
		],
		semi: 0
	}
};
