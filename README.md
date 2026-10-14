# Umi Max 后台管理框架

## 项目介绍

本项目是基于 Umi Max 4、React 19、TypeScript、Ant Design 6 和 ProComponents 3 的后台管理模板，可用于搭建企业内部管理系统。

项目已提供混合布局、顶部导航、侧栏菜单、欢迎页、加载骨架屏、语言切换和布局设置，以及 DEV 本地开发、UAT、PRE、PROD 四套环境配置。用户管理和权限管理已具备页面结构，业务数据、登录认证和实际权限控制需根据项目需求接入。

接口请求使用 Umi request，服务端数据缓存使用 React Query；代码规范由 ESLint、Prettier 和 Stylelint 统一管理。更多依赖用途见 [插件与依赖说明](docs/插件与依赖说明.md)。

单元与组件测试使用 Jest 和 React Testing Library，执行 `pnpm test`；监听和覆盖率命令见 [Jest 测试说明](docs/Jest测试说明.md)。端到端测试使用 Playwright，执行 `pnpm test:e2e` 自动启动独立测试服务并运行 Chromium 测试。安装、UI 模式、报告和新增用例说明见 [Playwright 测试说明](docs/Playwright测试说明.md)。

## 开发准备

- Node.js：22.22.1 或更高版本，满足当前提交检查工具的版本要求。
- 包管理工具：pnpm。
- 在项目根目录执行下文命令，即 `package.json` 所在目录。

首次使用时安装依赖：

```bash
pnpm install
```

安装过程中会自动执行 `max setup`，生成 Umi 所需的临时文件和 TypeScript 路径映射。项目的测试依赖也会一并安装。

## 启动项目

### 默认启动

```bash
pnpm dev
```

默认启动 **DEV 本地开发环境**，也可以使用 `pnpm start`。

启动后访问 [http://localhost:8888/framework/welcome/](http://localhost:8888/framework/welcome/)，默认端口由 `.env` 中的 `PORT` 配置。如果端口被占用，以终端输出的实际地址为准。开发服务支持热更新，修改代码后可在浏览器查看效果；停止服务按 `Ctrl+C`。

### 本地开发环境

`pnpm dev` 和 `pnpm start` 读取 `.env.dev`，将 `APP_ENV` 标记为 `dev`。DEV 的默认接口与代理目标和 UAT 一致，也可以单独修改。React Query Devtools 只在 DEV 开发模式启用。

### 按环境启动排查

| 环境          | 启动命令        |
| ------------- | --------------- |
| UAT 测试环境  | `pnpm dev:uat`  |
| PRE 预发环境  | `pnpm dev:pre`  |
| PROD 生产环境 | `pnpm dev:prod` |

这些命令启动支持热更新的本地服务，分别读取 `.env.uat`、`.env.pre`、`.env.production`。排查前请在对应文件配置实际的 `API_BASE_URL`；使用相对地址时，通过 `API_PROXY_TARGET` 配置本地代理目标。React Query Devtools 仅在 DEV 环境启用。

## 测试

项目使用两套测试工具：Jest 30 + React Testing Library 测试基础逻辑和 React 组件，Playwright 在真实浏览器中测试页面流程。

### 单元与组件测试

安装项目依赖后即可运行，无需先启动开发服务或安装浏览器：

```bash
pnpm test           # 运行全部单元与组件测试一次
pnpm test:watch     # 监听文件变化，持续运行相关测试
pnpm test:coverage  # 运行测试并生成覆盖率报告
```

配置入口为 `jest.config.cjs`，新增用例放在 `tests/unit/`，使用 `*.test.ts` 或 `*.test.tsx` 文件名。当前基础用例覆盖请求与 Token 处理、超时重试、品牌和布局配置持久化，以及颜色选择器交互。

测试环境使用 jsdom，已配置 DOM 断言、浏览器 API 模拟、存储隔离和静态资源替身。Umi 路径别名会自动同步到 Jest。jsdom 不执行真实布局，响应式表现和浏览器页面流程交给 Playwright 验证。

覆盖率报告输出到 `coverage/`，打开 `coverage/index.html` 查看详情；报告包含尚未测试的应用源码，目前未设置统一覆盖率门槛。新增用例、模块 Mock 和指定文件运行方式见 [Jest 测试说明](docs/Jest测试说明.md)。

### 浏览器端到端测试

首次运行前安装 Chromium：

```bash
pnpm test:e2e:install
pnpm test:e2e
```

配置入口为 `playwright.config.ts`，用例位于 `tests/e2e/`，使用 `*.spec.ts` 文件名。测试默认启动独立 DEV 服务，监听 `127.0.0.1:18101`，运行结束后自动关闭。

可使用 `pnpm test:e2e:ui` 打开交互模式、`pnpm test:e2e:headed` 查看浏览器执行过程，或使用 `pnpm test:e2e:report` 查看 HTML 报告。报告输出到 `playwright-report/`，失败时的截图、视频和 Trace 输出到 `test-results/`。

当前浏览器用例覆盖登录校验、模拟登录与退出、用户页面直接访问和刷新，以及品牌切换与持久化。登录仍使用模拟实现，接入真实认证后需同步调整测试数据和用例。指定已有服务、调整测试端口和调试方法见 [Playwright 测试说明](docs/Playwright测试说明.md)。

两套测试分别运行，打包命令和提交钩子不会自动执行测试。提交前建议运行 `pnpm test`、`pnpm typecheck` 和 `pnpm lint`；修改页面流程时再运行 `pnpm test:e2e`。

## 项目打包

### 默认打包

```bash
pnpm build
```

**默认打包 UAT 测试环境。** 打包完成后，静态文件输出到项目根目录的 `framework/`。

### 指定环境打包

| 环境          | 打包命令          | 环境文件          | 产物目录     |
| ------------- | ----------------- | ----------------- | ------------ |
| UAT 测试环境  | `pnpm build:uat`  | `.env.uat`        | `framework/` |
| PRE 预发环境  | `pnpm build:pre`  | `.env.pre`        | `framework/` |
| PROD 生产环境 | `pnpm build:prod` | `.env.production` | `framework/` |

生产发布时执行：

```bash
pnpm build:prod
```

所有打包命令都会执行 `max build`，生成经过构建优化的静态资源。`outputPath` 仅在 build 命令中读取 `BUILD_OUTPUT_PATH`，默认输出到项目根目录的 `framework/`；本地启动命令不设置该目录。发布前应确认对应环境的接口地址已配置正确。

在 `.env` 中配置公共默认值，或通过 `.env.local` 覆盖个人配置：

```dotenv
BUILD_OUTPUT_PATH=framework
```

该值为相对于项目根目录的文件夹路径，不要添加开头的 `/`。如需临时区分产物目录，可在 `.env.local` 中设置 `BUILD_OUTPUT_PATH=framework/uat`。Umi 会用公共环境文件覆盖同名进程变量，因此公共变量的个人覆盖应写在 `.env.local`。构建会清理指定的产物目录，因此不能指向项目根目录或项目外的目录。

所有环境的构建均关闭 Source Map，发布目录会清理残留 `.map` 和 `stats.json`；各环境的本地启动仍保留开发用源码映射。浏览器兼容目标为 Chrome/Edge 100、Firefox 100、Safari 15.4 及以上，可在 `config/config.ts` 调整。

构建的入口及异步 JS 输出到 `framework/js/`，CSS 输出到 `framework/css/`，文件名保留内容哈希。静态加载脚本放在 `public/js/loading.js`，发布时也会复制到 `js/`。HTML、图片等资源保留各自的输出位置；更改 `BUILD_OUTPUT_PATH` 后，以上目录跟随输出根目录变化。

每次 build 在所有 HTML 生成后，为 JS、CSS、HTML、SVG、JSON、TXT、XML 生成同名 `.gz` 文件，使用 gzip 级别 9；压缩后更大的小文件不生成 `.gz`。原文件用于不支持 gzip 的客户端及服务器回退，图片、业务 JSON、许可证和路由 HTML 也会保留。可直接上传整个输出目录。此处理使用 Umi 的最终输出路径，因此也支持 `BUILD_OUTPUT_PATH` 的自定义目录。

完整的上传要求、Nginx 配置、gzip 优先读取与部署验证步骤见 [Nginx 部署说明](docs/Nginx部署说明.md)。

项目沿用 Umi 的路由按需加载，并通过 `utoopack.optimization.packageImports` 优化 ProComponents 的入口导入。原生 `splitChunks` 将 JS 的最小合并目标设为 20 KB、最大合并目标设为 100 KB，每组最多 40 个分包，避免过多碎片。这里的大小是分包算法的参考值，不是最终压缩文件的硬性上限，公共依赖仍可能超过该值；拆分文件也不意味着总下载体积一定减少。以后接入图表、编辑器、PDF 等较重功能时，应在对应路由或使用 `import()` 按需加载，避免在 `app.tsx` 或全局组件中直接引入。

每次成功打包后执行 `pnpm deadcode`，检测未使用文件和导出，只提示、不阻断构建。Utoopack 下使用 Knip 补充 Umi 的 `deadCode` 配置，Umi 自动加载的生命周期导出已排除误报。单独执行检测前，至少完成一次打包以生成生产入口。检测不会自动删除代码。

目前未启用体积分析和第三方访问统计。

## 接口与环境配置

公共变量和业务环境变量分别维护在项目根目录：

| 文件              | 用途                                      |
| ----------------- | ----------------------------------------- |
| `.env`            | 公共进程变量，例如端口和构建产物目录      |
| `.env.dev`        | DEV 本地开发的接口地址和代理目标          |
| `.env.uat`        | UAT 测试环境的接口地址和代理目标          |
| `.env.pre`        | PRE 预发环境的接口地址和代理目标          |
| `.env.production` | PROD 生产环境的接口地址和代理目标         |
| `.env.*.local`    | 对应环境的个人覆盖，例如 `.env.uat.local` |
| `.env.local`      | 公共个人覆盖，也可以统一覆盖接口与代理    |

项目沿用 UAT 表示业务测试环境，因此使用 `.env.uat`。Jest / Playwright 的自动化测试配置仍由各自的配置文件管理。

Umi 原生只读取 `.env` 和 `.env.local`；`config/env.ts` 根据 `UMI_ENV` 补充读取 `.env.<环境>` 和可选的 `.env.<环境>.local`。接口变量优先级从高到低为：**当前进程变量（包含 Umi 已加载的公共 `.env` / `.env.local`）→ `.env.<环境>.local` → `.env.<环境>`**。公共 `.env` 建议只放公共进程变量，接口默认值放在对应环境文件中；`.env.local` 中的接口变量会覆盖所有环境。

各环境统一使用相同变量名，接口地址默认是 `/`，使用同源请求。例如修改 `.env.uat`，或创建 `.env.uat.local`：

```dotenv
API_BASE_URL=/

# 接口使用相对路径时，本地开发服务的代理目标
API_PROXY_TARGET=https://uat-api.example.com
```

如果希望浏览器直接请求接口域名，可将 `API_BASE_URL` 改为实际的绝对地址，并确保后端允许跨域。代理只处理 `/api/` 路径，会去掉 `/api` 前缀再转发。

以上域名为示例，使用时替换为实际接口地址。公共及各环境默认文件纳入版本管理；`.env.local` 和 `.env.*.local` 已被 Git 忽略。原有 `UAT_API_BASE_URL`、`PRE_API_BASE_URL`、`PROD_API_BASE_URL` 及对应的 `*_API_PROXY_TARGET` 统一改为 `API_BASE_URL`、`API_PROXY_TARGET`，本地或 CI 旧配置需同步更新。

启动和打包脚本通过 `UMI_ENV` 选择环境：DEV 对应 `dev`，UAT 对应 `uat`，PRE 对应 `pre`，PROD 对应 `production`。框架配置统一在 `config/config.ts` 中，浏览器中的 `process.env.APP_ENV` 分别为 `dev`、`uat`、`pre`、`prod`，接口地址通过 `process.env.API_BASE_URL` 提供给全局 request。现有启动和打包命令保持不变。

环境变量在启动或打包时确定，修改后需重新启动或打包。注入浏览器代码的变量不要包含密钥。

### Windows 启动与打包

项目脚本中的环境变量赋值适用于 macOS / Linux。Windows cmd 可以先设置环境，再执行 Umi 命令。例如启动本地 DEV：

```bat
set UMI_ENV=dev
pnpm exec max dev
```

打包生产环境：

```bat
set UMI_ENV=production
pnpm exec max build
```

## 部署说明

将配置的产物目录（默认 `framework/`）中的内容部署到静态服务器，访问前缀为 `/framework/`。

- `config/config.ts` 中的 `base` 和 `publicPath` 均为 `/framework/`，服务器需要将静态资源映射到该路径。
- 项目使用 browser history 路由，刷新或直接访问业务页面时，服务器需回退到应用入口 HTML。
- 如需修改部署前缀，应同步修改配置和代码中的 Logo、图片、加载脚本等资源路径。
- 各环境的本地服务均提供 `/api/` 代理，目标通过对应环境文件的 `API_PROXY_TARGET` 配置。代理仅作用于本地启动服务；线上部署需由服务器配置反向代理。

## 主要目录

```text
config/                 # 框架配置、环境文件读取、菜单路由与布局设置
  plugins/              # 路径别名同步、构建资源和部署处理插件
src/
  app.tsx               # 应用初始化、布局和全局请求配置
  access.ts             # 权限定义入口
  pages/                # 欢迎页、用户管理、权限管理等页面
  components/           # 公共组件、骨架屏和网络状态提示
  models/               # 全局共享状态
  locales/              # 中英文语言文件
  utils/                # 通用工具函数
  global.less           # 全局样式
public/                 # 静态资源
tests/
  unit/                 # Jest 单元与组件测试
  e2e/                  # Playwright 浏览器端到端测试
  mocks/                # 测试用静态资源替身
  setup.ts              # Jest 测试环境初始化
  transform.cjs         # TypeScript Mock 转换适配
jest.config.cjs         # Jest 配置
playwright.config.ts    # Playwright 配置
docs/                   # 依赖、测试、路径别名和部署说明
```

新增页面时，在 `src/pages/` 创建页面组件，再到 `config/routes.ts` 注册路由和菜单。布局默认设置位于 `config/defaultSettings.ts`。

## 路径别名

源码可以通过 `@/` 引用，例如 `@/utils/request`；同时提供 `@root`、`@components`、`@pages`、`@utils`、`@models`、`@locales`、`@constants` 和 `@public` 等目录别名。类型文件使用 `@/types/xxx`。

目录别名统一维护在 `config/config.ts` 的 `alias` 中，本地插件 `config/plugins/sync-aliases.ts` 会将自定义映射追加到 Umi 生成的 TypeScript 配置，Jest 也会读取同一份 Umi 别名。根目录 `tsconfig.json` 继承生成的配置，保留项目的严格检查选项。

新增别名后执行 `pnpm setup`，并重启正在运行的开发服务。不要在根 `tsconfig.json` 中重新定义 `paths`，否则会覆盖框架映射；类型目录也不要使用 `@types` 别名。完整映射、示例和静态资源引用方式见 [路径别名说明](docs/路径别名说明.md)。

## 常用检查命令

```bash
pnpm test          # 单元与组件测试
pnpm lint          # 代码与样式检查
pnpm lint:fix      # 自动修复代码与样式
pnpm typecheck     # TypeScript 类型检查
pnpm deadcode      # 未使用文件与导出检查（需先完成一次打包）
pnpm format        # 格式化项目文件
pnpm format:check  # 检查文件格式
```

如果类型检查提示缺少 `src/.umi/tsconfig.json`，先执行 `pnpm setup` 生成临时文件，再重新检查。
