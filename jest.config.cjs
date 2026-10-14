const { configUmiAlias, createConfig } = require('@umijs/max/test');

/** @returns {Promise<import('jest').Config>} */
module.exports = async () => {
  // Knip 也会加载此配置；未指定 NODE_ENV 时避免 Umi 生成 .umi-undefined。
  process.env.NODE_ENV ??= 'test';
  const config = await configUmiAlias(
    createConfig({
      target: 'browser',
      jsTransformer: 'esbuild',
      jsTransformerOpts: { jsx: 'automatic' },
    }),
  );

  return {
    ...config,
    rootDir: __dirname,
    roots: ['<rootDir>/src', '<rootDir>/tests/unit'],
    testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/unit/**/*.test.tsx'],
    watchPathIgnorePatterns: ['<rootDir>/src/\\.umi'],
    testEnvironmentOptions: { url: 'http://localhost/framework/' },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
    maxWorkers: 2,
    cacheDirectory: '<rootDir>/node_modules/.cache/jest',
    transform: {
      ...config.transform,
      '^.+\\.(t|j)sx?$': '<rootDir>/tests/transform.cjs',
    },
    moduleNameMapper: {
      '\\.(svg|png|jpe?g|gif|webp|ico|woff2?|ttf|eot)$': '<rootDir>/tests/mocks/file.cjs',
      ...config.moduleNameMapper,
    },
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/.umi*/**', '!src/**/*.d.ts'],
    coverageProvider: 'v8',
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['text', 'html', 'lcov'],
  };
};
