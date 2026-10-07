module.exports = {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    '**/node_modules/**',
    '**/.umi*/**',
    'dist/**',
    'coverage/**',
    '.pnpm-store/**',
    '.turbopack/**',
  ],
  overrides: [
    {
      files: ['**/*.less'],
      extends: ['stylelint-config-standard-less'],
      customSyntax: 'postcss-less',
      rules: { 'media-feature-range-notation': 'prefix' },
    },
  ],
  rules: {
    'selector-class-pattern': null,
    'no-descending-specificity': null,
    'no-duplicate-selectors': true,
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-syntaxes'] },
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'utility',
          'variant',
          'custom-variant',
          'source',
          'apply',
          'reference',
          'config',
          'plugin',
        ],
      },
    ],
  },
};
