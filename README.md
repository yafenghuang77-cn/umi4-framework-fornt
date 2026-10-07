# Umi Max 后台管理框架

## 项目介绍

本项目是基于 Umi Max 4、React 19、TypeScript、Ant Design 6 和 ProComponents 3 的后台管理模板，可用于搭建企业内部管理系统。

项目已提供混合布局、顶部导航、侧栏菜单、欢迎页、加载骨架屏、语言切换和布局设置，以及 DEV 本地开发、UAT、PRE、PROD 四套环境配置。用户管理和权限管理已具备页面结构，业务数据、登录认证和实际权限控制需根据项目需求接入。

接口请求使用 Umi request，服务端数据缓存使用 React Query；代码规范由 ESLint、Prettier 和 Stylelint 统一管理。更多依赖用途见 [插件与依赖说明](docs/插件与依赖说明.md)。

## 开发准备

- Node.js：22.22.1 或更高版本，满足当前提交检查工具的版本要求。
- 包管理工具：pnpm。
- 在项目根目录执行下文命令，即 `package.json` 所在目录。

首次使用时安装依赖：

```bash
pnpm install
```

安装过程中会自动执行 `max setup`，生成 Umi 所需的临时文件。

## 启动项目

### 默认启动

```bash
pnpm dev
```

默认启动 **DEV 本地开发环境**，也可以使用 `pnpm start`。

启动后访问 [http://localhost:8000/framework/welcome/](http://localhost:8000/framework/welcome/)。如果端口被占用，以终端输出的实际地址为准。开发服务支持热更新，修改代码后可在浏览器查看效果；停止服务按 `Ctrl+C`。

### 本地开发环境

`pnpm dev` 和 `pnpm start` 使用 `config/config.dev.ts`，复用 UAT 的接口配置（包括 `UAT_API_BASE_URL`）与本地代理，仅将 `APP_ENV` 标记为 `dev`。React Query Devtools 只在 DEV 开发模式启用。

### 按环境启动排查

| 环境          | 启动命令        |
| ------------- | --------------- |
| UAT 测试环境  | `pnpm dev:uat`  |
| PRE 预发环境  | `pnpm dev:pre`  |
| PROD 生产环境 | `pnpm dev:prod` |

这些命令启动支持热更新的本地服务，分别加载对应环境的接口配置与代理。排查前请配置实际的 `UAT_API_BASE_URL`、`PRE_API_BASE_URL` 或 `PROD_API_BASE_URL`；使用相对地址时，请在 `config/proxy.ts` 配置对应代理目标。React Query Devtools 仅在 DEV 环境启用。

## 项目打包

### 默认打包

```bash
pnpm build
```

**默认打包 UAT 测试环境。** 打包完成后，静态文件输出到项目根目录的 `dist/`。

### 指定环境打包

| 环境          | 打包命令          | 配置文件                      |
| ------------- | ----------------- | ----------------------------- |
| UAT 测试环境  | `pnpm build:uat`  | `config/config.uat.ts`        |
| PRE 预发环境  | `pnpm build:pre`  | `config/config.pre.ts`        |
| PROD 生产环境 | `pnpm build:prod` | `config/config.production.ts` |

生产发布时执行：

```bash
pnpm build:prod
```

所有打包命令都会执行 `max build`，生成经过构建优化的静态资源。发布前应确认对应环境的接口地址已配置正确。

## 接口与环境配置

各环境的接口地址默认是 `/`，使用同源请求。可以直接修改对应环境配置文件，或在项目根目录创建 `.env.local` 覆盖地址：

```dotenv
UAT_API_BASE_URL=https://uat-api.example.com
PRE_API_BASE_URL=https://pre-api.example.com
PROD_API_BASE_URL=https://api.example.com
```

以上域名为示例，使用时替换为实际接口地址。`.env.local` 已被 Git 忽略，适合保存个人开发配置；`.env` 用于公共进程变量。

启动和打包脚本通过 `UMI_ENV` 选择环境：DEV 对应 `dev`，UAT 对应 `uat`，PRE 对应 `pre`，PROD 对应 `production`。浏览器中的 `process.env.APP_ENV` 分别为 `dev`、`uat`、`pre`、`prod`，接口地址通过 `process.env.API_BASE_URL` 提供给全局 request。

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

将 `dist/` 中的构建产物部署到静态服务器，访问前缀为 `/framework/`。

- `config/config.ts` 中的 `base` 和 `publicPath` 均为 `/framework/`，服务器需要将静态资源映射到该路径。
- 项目使用 browser history 路由，刷新或直接访问业务页面时，服务器需回退到应用入口 HTML。
- 如需修改部署前缀，应同步修改配置和代码中的 Logo、图片、加载脚本等资源路径。
- DEV 与 UAT 复用本地 `/api/` 代理，默认转发到 `http://localhost:8080`；可在 `config/proxy.ts` 调整。

## 主要目录

```text
config/                 # 公共配置、环境配置、菜单路由与布局设置
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
docs/                  # 依赖与插件说明
```

新增页面时，在 `src/pages/` 创建页面组件，再到 `config/routes.ts` 注册路由和菜单。布局默认设置位于 `config/defaultSettings.ts`。

## 常用检查命令

```bash
pnpm lint          # 代码与样式检查
pnpm lint:fix      # 自动修复代码与样式
pnpm typecheck     # TypeScript 类型检查
pnpm format        # 格式化项目文件
pnpm format:check  # 检查文件格式
```

如果类型检查提示缺少 `src/.umi/tsconfig.json`，先执行 `pnpm setup` 生成临时文件，再重新检查。
