// 使用 Umi 提供的迁移开关跳过旧插件解析补丁，统一加载项目安装的插件。
process.env.UMI_UTLINT_MIGRATE = '1';

module.exports = {
  // 保留 Umi Max 基础规范，在下面扩展项目规则。
  root: true,
  ignorePatterns: [
    'node_modules/',
    '**/.umi*/',
    'dist/',
    'coverage/',
    '.pnpm-store/',
    '.turbopack/',
    '**/*.min.js',
    '!.eslintrc.js',
    '!.stylelintrc.js',
  ],
  extends: [require.resolve('@umijs/max/eslint'), 'eslint:recommended', 'prettier'],
  env: { browser: true, node: true, es2022: true },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['simple-import-sort'],
  rules: {
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    curly: ['error', 'all'],
    'no-var': 'error',
    'prefer-const': 'error',
    'no-debugger': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          ['^\\u0000'],
          ['^react(?:$|/)', '^react-dom(?:$|/)'],
          ['^@?\\w'],
          ['^@/'],
          ['^\\.'],
          ['^.+\\u0000$'],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
  },
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/no-explicit-any': 'error',
        // Umi 基础配置中的旧规则由新版 TypeScript 推荐规则替代。
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-invalid-this': 'off',
        'no-invalid-this': 'error',
        '@typescript-eslint/ban-ts-comment': 'error',
      },
    },
    {
      files: ['**/*.{jsx,tsx}'],
      extends: [
        'plugin:react/recommended',
        'plugin:react/jsx-runtime',
        'plugin:jsx-a11y/recommended',
      ],
      plugins: ['react-hooks'],
      settings: { react: { version: 'detect' } },
      rules: {
        'react/prop-types': 'off',
        'react/jsx-key': 'error',
        'react/jsx-no-target-blank': 'error',
        'react/self-closing-comp': 'error',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
      },
    },
  ],
};
