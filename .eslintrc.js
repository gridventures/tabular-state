const typescriptNamingConvention = [
  {
    selector: 'default',
    format: ['strictCamelCase'],
    leadingUnderscore: 'forbid',
    trailingUnderscore: 'forbid',
  },
  {
    selector: 'memberLike',
    format: null,
    leadingUnderscore: 'allow',
    trailingUnderscore: 'forbid',
  },
  {
    selector: 'typeLike',
    format: ['PascalCase'],
  },
  {
    selector: ['typeParameter'],
    format: ['PascalCase'],
  },
];

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.eslint.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
    ecmaVersion: 'es2022',
    ecmaFeatures: {
      jsx: true,
    },
  },
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['import'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        paths: ['node_modules/', 'node_modules/@types'],
      },
    },
  },
  rules: {
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/naming-convention': ['error', ...typescriptNamingConvention],
    'import/prefer-default-export': 'off',
    'import/no-unresolved': [2],
    'import/order': [
      'error',
      {
        'groups': [
          'type',
          'external',
          'index',
          'sibling',
          'parent',
          'internal',
          'builtin',
          'object',
        ],
        'alphabetize': { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always-and-inside-groups',
      },
    ],
    'import/extensions': [
      'error',
      {
        js: 'never',
        jsx: 'never',
        mjs: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'import/no-relative-packages': 'off',
    'multiline-comment-style': 'off',
    'no-console': 'error',
    'max-len': ['warn', { code: 100 }],
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
  },
  overrides: [
    {
      files: ['**/*.config.ts', '**/*.config.js', './.eslintrc.js', '**/tailwind/*.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'import/no-default-export': 'off',
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['**/*.ts'],
      rules: {
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/naming-convention': [
          'error',
          ...typescriptNamingConvention,
          {
            selector: 'variable',
            format: ['strictCamelCase', 'UPPER_CASE'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
          },
        ],
      },
    },
  ],
};
