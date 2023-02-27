module.exports = {
  root: true,

  env: {
    browser: true,
    es6: true,
    node: true,
  },

  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2022,
    ecmaFeatures: {
      jsx: true,
    },
  },

  extends: [
    '@gridventures/eslint-config-base',
    '@gridventures/eslint-config-typescript',
    '@gridventures/eslint-config-base/prettier',
  ],

  rules: {
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    'no-shadow': 'off',
  },

  overrides: [
    // Typescript overrides
    {
      files: ['**/*.ts'],

      parser: '@typescript-eslint/parser',

      parserOptions: {
        project: 'tsconfig.eslint.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
        ecmaVersion: 2022,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },

    {
      files: ['**/vite.config.ts'],

      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
