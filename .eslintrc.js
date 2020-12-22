module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'standard',
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  rules: {
		// enforce tabs over spaces, as tabs make code more accessible :)
		"no-tabs": 0,
		"indent": ["error", "tab"],
  },
};
