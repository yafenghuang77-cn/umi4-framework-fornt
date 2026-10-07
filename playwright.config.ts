import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 18101);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PLAYWRIGHT_PORT 必须是 1 到 65535 之间的整数');
}
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  outputDir: 'test-results',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // 指定已有服务时跳过启动；默认只管理测试自己启动的服务。
  webServer: externalBaseURL
    ? undefined
    : {
        command: 'pnpm exec max dev',
        url: `${baseURL}/framework/user/login`,
        reuseExistingServer: false,
        timeout: 180_000,
        env: {
          UMI_ENV: 'dev',
          PLAYWRIGHT_TEST: '1',
          PLAYWRIGHT_PORT: String(port),
          BROWSER: 'none',
        },
      },
});
