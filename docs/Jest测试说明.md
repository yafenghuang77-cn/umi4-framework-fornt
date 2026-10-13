# Jest 测试说明

项目使用 Jest 30、React Testing Library 和 jsdom，测试基础逻辑与 React 组件。浏览器页面流程继续使用 Playwright，两套测试分别运行。

## 常用命令

| 命令                                   | 用途                           |
| -------------------------------------- | ------------------------------ |
| `pnpm test`                            | 运行全部单元和组件测试一次     |
| `pnpm test:watch`                      | 根据文件变化持续运行相关测试   |
| `pnpm test:coverage`                   | 运行测试并生成覆盖率报告       |
| `pnpm test tests/unit/request.test.ts` | 运行指定测试文件               |
| `pnpm test --testNamePattern="品牌"`   | 根据测试名称筛选               |
| `pnpm test:e2e`                        | 运行原有 Playwright 浏览器测试 |

依赖安装完成后可以直接运行 `pnpm test`。配置通过 Umi 的 `configUmiAlias` 自动生成所需临时文件并读取别名，不启动开发服务、不连接真实接口，也不需要安装 Chromium。首次运行时会显示 Umi 的初始化日志。

监听模式退出按 `Ctrl+C`。覆盖率报告保存在 `coverage/`：`index.html` 为可视化报告，`lcov.info` 可供 CI 使用；该目录已被 Git 忽略。覆盖率统计应用源码，尚未设置统一百分比门槛。

## 文件组织

```text
jest.config.cjs                     # Jest 配置和 Umi 别名同步
tests/
  setup.ts                         # DOM 断言、浏览器 API 模拟和存储隔离
  transform.cjs                    # 带 Mock 的 TypeScript 转换适配
  mocks/file.cjs                   # SVG、图片和字体的文件替身
  unit/*.test.ts                   # 逻辑测试
  unit/*.test.tsx                  # React 组件测试
  e2e/*.spec.ts                    # 原有 Playwright 测试
```

Jest 只查找 `tests/unit/` 中的 `*.test.ts` 与 `*.test.tsx`，不会运行 Playwright 的 `*.spec.ts`。测试文件放在应用源码之外，不会被 Umi 约定为页面或模型。

## 环境与模块解析

- 使用 jsdom 提供 `window`、`document` 与本地存储，页面地址设为 `http://localhost/framework/`。
- 加载 `@testing-library/jest-dom`，支持 `toBeInTheDocument()`、`toBeVisible()` 等断言。
- React Testing Library 自动清理组件；测试结束后清空本地存储和会话存储。Jest 自动清理 Mock 调用记录并恢复 Spy。
- 为 Ant Design 提供 `matchMedia` 替身，并补充 `TextEncoder`、`TextDecoder`。jsdom 不执行真实布局与媒体查询；响应式布局和实际尺寸应使用 Playwright 验证。
- 通过 Umi 的 `configUmiAlias` 读取 `config/config.ts` 的别名，支持 `@/`、`@root`、`@components`、`@utils` 等，新增目录别名时无需重复维护 Jest 映射。
- Less/CSS 使用 Umi 自带的类名代理，SVG、图片和字体使用文件替身；浏览器视觉效果由 Playwright 验证。
- TS/TSX 使用 Umi 提供的 esbuild 转换器。对于包含 `jest.mock` 或 `jest.doMock` 的 TypeScript 文件，`tests/transform.cjs` 先去掉类型，再交给 Umi 执行 Mock 提升与代码转换，兼容内联 `import { type ... }` 语法。
- 测试配置使用 CommonJS 文件，无需依赖 ts-node 加载配置；现有 ts-node 安装保留。

转换器只转换语法，类型正确性仍由 `pnpm typecheck` 检查。

## 当前基础用例

- 查询只对超时重试，达到上限后停止，取消及普通错误不重试。
- Token 保存、清理、请求注入、`skipAuth` 和显式 Authorization 优先。
- 后端 `data` 提取、完整响应、业务失败、401 登录跳转、下载响应及错误继续传递。
- 品牌新旧存储格式兼容、失效数据回退、布局默认配置合并和存储不可用处理。
- 使用真实 Ant Design 组件测试颜色选择器的选中状态与用户点击行为。

## 新增用例

逻辑测试可以直接使用 Jest 的 `describe`、`test`、`expect` 与 `jest`：

```ts
import { retryTimedOutQuery } from '@utils/requestRetry';

test('达到重试上限后停止', () => {
  expect(retryTimedOutQuery(5, { code: 'ETIMEDOUT' })).toBe(false);
});
```

组件测试使用 `render`、`screen` 和 `userEvent.setup()`。参考 `tests/unit/ColorSwatchPicker.test.tsx`，优先通过角色和可访问名称查找控件，再使用自动等待的断言。

模块使用 Umi 的路由、全局状态等运行时 API 时，在对应测试中按需使用 `jest.mock('@umijs/max', ...)`，仅模拟该用例实际使用的 API。不要连接真实登录接口或共享环境数据。

提交前建议运行：

```bash
pnpm test
pnpm typecheck
pnpm lint
```

Jest 不自动加入构建或提交钩子。需要覆盖完整页面流程时，再运行 `pnpm test:e2e`。

参考：[Jest 配置](https://jestjs.io/docs/configuration)、[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)、[Umi 测试](https://umijs.org/docs/guides/test/)。
