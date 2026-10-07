# Playwright 测试说明

项目使用 `@playwright/test`，配置入口为根目录 `playwright.config.ts`，端到端测试位于 `tests/e2e/`。默认使用 Chromium，每个用例有独立的浏览器上下文，Cookie 和本地存储不会在用例之间共享。

## 安装与运行

首次使用时安装依赖及 Chromium：

```bash
pnpm install
pnpm test:e2e:install
```

在 Linux CI 中首次安装浏览器及系统依赖可执行 `pnpm exec playwright install --with-deps chromium`。

| 命令                                     | 用途                    |
| ---------------------------------------- | ----------------------- |
| `pnpm test:e2e`                          | 无界面运行全部测试      |
| `pnpm test:e2e:ui`                       | 打开 Playwright UI 模式 |
| `pnpm test:e2e:headed`                   | 显示浏览器运行测试      |
| `pnpm test:e2e:report`                   | 查看上一次 HTML 报告    |
| `pnpm test:e2e -- tests/e2e/app.spec.ts` | 运行指定测试文件        |
| `pnpm test:e2e -- --grep "品牌切换"`     | 按名称筛选测试          |

普通测试默认自动启动 DEV 服务，监听 `127.0.0.1:18101`，结束后由 Playwright 关闭。此服务独立于日常开发端口，不修改 `.env.local`，也不会复用或关闭已经运行的开发服务。测试端口已占用时会报错，不会悄悄切换到其他端口。

## 指定端口或已有服务

以下环境变量通过终端设置，不依赖 Umi 的 `.env` 文件。命令示例适用于 macOS / Linux。

```bash
# 更换测试服务端口
PLAYWRIGHT_PORT=18102 pnpm test:e2e

# 使用已启动的本地服务，跳过自动启动服务
PLAYWRIGHT_BASE_URL=http://localhost:8101 pnpm test:e2e
```

`PLAYWRIGHT_BASE_URL` 设置为站点源地址即可，不要重复添加 `/framework/`，测试路径已包含该前缀。使用已有服务时，Playwright 不负责关闭它。

## 当前覆盖范围

- 登录页必填字段校验。
- 模拟登录成功跳转首页，退出后回到登录页。
- 直接访问及刷新用户账号页面。
- 品牌切换触发刷新，当前路由不变，再次刷新后仍保留选择。

登录用例使用假账号和假密码，针对当前模拟登录实现。接入真实认证或真实用户列表后，需要调整用例和测试数据；当前用例应在开发或专用测试服务中运行。

## 报告与调试

控制台显示测试结果，HTML 报告输出到 `playwright-report/`。失败时截图、视频和 Trace 输出到 `test-results/`，成功用例不保留这些文件。上述产物已经加入 Git 忽略。

查看失败用例的 Trace：

```bash
pnpm exec playwright show-trace test-results/对应失败用例/trace.zip
```

本地默认最多两个并行工作进程、不自动重试。CI 环境使用一个工作进程，失败最多重试两次，并禁止提交 `test.only`。测试不会自动加入 build 命令，也不会被打包到发布目录。

## 添加用例

在 `tests/e2e/` 添加 `*.spec.ts` 文件，使用语义化定位和自动等待断言，避免固定时间等待：

```ts
import { expect, test } from '@playwright/test';

test('登录页面可访问', async ({ page }) => {
  await page.goto('/framework/user/login');
  await expect(page.getByRole('heading', { name: '登录工作台' })).toBeVisible();
});
```

参考 [Playwright 配置说明](https://playwright.dev/docs/test-configuration) 与 [自动启动测试服务](https://playwright.dev/docs/test-webserver)。
