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

**默认打包 UAT 测试环境。** 打包完成后，静态文件输出到项目根目录的 `framework/`。

### 指定环境打包

| 环境          | 打包命令          | 配置文件                      | 产物目录     |
| ------------- | ----------------- | ----------------------------- | ------------ |
| UAT 测试环境  | `pnpm build:uat`  | `config/config.uat.ts`        | `framework/` |
| PRE 预发环境  | `pnpm build:pre`  | `config/config.pre.ts`        | `framework/` |
| PROD 生产环境 | `pnpm build:prod` | `config/config.production.ts` | `framework/` |

生产发布时执行：

```bash
pnpm build:prod
```

所有打包命令都会执行 `max build`，生成经过构建优化的静态资源。`outputPath` 仅在 build 命令中读取 `BUILD_OUTPUT_PATH`，默认输出到项目根目录的 `framework/`；本地启动命令不设置该目录。发布前应确认对应环境的接口地址已配置正确。

在 `.env` 中配置公共默认值，或通过 `.env.local` 覆盖个人配置：

```dotenv
BUILD_OUTPUT_PATH=framework
```

该值为相对于项目根目录的文件夹路径，不要添加开头的 `/`。如需临时区分环境，可执行 `BUILD_OUTPUT_PATH=framework/uat pnpm build:uat`。构建会清理指定的产物目录，因此不能指向项目根目录或项目外的目录。

所有环境的构建均关闭 Source Map，发布目录会清理残留 `.map` 和 `stats.json`；各环境的本地启动仍保留开发用源码映射。浏览器兼容目标为 Chrome/Edge 100、Firefox 100、Safari 15.4 及以上，可在 `config/config.ts` 调整。

构建的入口及异步 JS 输出到 `framework/js/`，CSS 输出到 `framework/css/`，文件名保留内容哈希。静态加载脚本放在 `public/js/loading.js`，发布时也会复制到 `js/`。HTML、图片等资源保留各自的输出位置；更改 `BUILD_OUTPUT_PATH` 后，以上目录跟随输出根目录变化。

每次 build 在所有 HTML 生成后，为 JS、CSS、HTML、SVG、JSON、TXT、XML 生成同名 `.gz` 文件，使用 gzip 级别 9；压缩后更大的小文件不生成 `.gz`。原文件用于不支持 gzip 的客户端及服务器回退，图片、业务 JSON、许可证和路由 HTML 也会保留。可直接上传整个输出目录。此处理使用 Umi 的最终输出路径，因此也支持 `BUILD_OUTPUT_PATH` 的自定义目录。

服务器需要支持静态 gzip。例如 Nginx 在站点配置中启用 `gzip_static on;` 和 `gzip_vary on;`，才会对支持 gzip 的客户端返回预压缩文件；未启用时仍正常返回原文件。浏览器访问地址保持为 `.js`、`.css` 等原始地址，无需添加 `.gz`。

Nginx 示例：将整个 `framework/` 文件夹上传到 `/srv/www/`，替换域名与服务器目录后使用以下站点配置。Nginx 需包含 `http_gzip_static_module` 模块，可通过 `nginx -V` 检查。

```nginx
server {
    listen 80;
    server_name example.com;
    root /srv/www;
    include /etc/nginx/mime.types;

    gzip_static on;
    gzip_vary on;

    # 静态资源不存在时返回 404，避免返回 HTML 导致脚本解析失败。
    location ~* ^/framework/.*\.(js|css|svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|woff2?|ttf)$ {
        try_files $uri =404;
    }

    # 支持直接访问及刷新前端路由。
    location /framework/ {
        try_files $uri $uri/ /framework/index.html;
    }
}
```

部署后用 `curl -I -H 'Accept-Encoding: gzip' https://你的域名/framework/js/loading.js` 验证响应包含 `Content-Encoding: gzip`。示例为 HTTP 站点；已有 HTTPS 站点只需合并 `root`、gzip 和 location 配置。

项目沿用 Umi 的路由按需加载，并通过 `utoopack.optimization.packageImports` 优化 ProComponents 的入口导入。原生 `splitChunks` 将 JS 的最小合并目标设为 20 KB、最大合并目标设为 100 KB，每组最多 40 个分包，避免过多碎片。这里的大小是分包算法的参考值，不是最终压缩文件的硬性上限，公共依赖仍可能超过该值；拆分文件也不意味着总下载体积一定减少。以后接入图表、编辑器、PDF 等较重功能时，应在对应路由或使用 `import()` 按需加载，避免在 `app.tsx` 或全局组件中直接引入。

每次成功打包后执行 `pnpm deadcode`，检测未使用文件和导出，只提示、不阻断构建。Utoopack 下使用 Knip 补充 Umi 的 `deadCode` 配置，Umi 自动加载的生命周期导出已排除误报。单独执行检测前，至少完成一次打包以生成生产入口。检测不会自动删除代码。

目前未启用体积分析和第三方访问统计。

## 接口与环境配置

各环境的接口地址默认是 `/`，使用同源请求。可以直接修改对应环境配置文件，或在项目根目录创建 `.env.local` 覆盖地址：

```dotenv
UAT_API_BASE_URL=https://uat-api.example.com
PRE_API_BASE_URL=https://pre-api.example.com
PROD_API_BASE_URL=https://api.example.com

# 接口使用相对路径时，本地开发服务的代理目标
# DEV 和 UAT 共用 UAT_API_PROXY_TARGET
UAT_API_PROXY_TARGET=https://uat-api.example.com
PRE_API_PROXY_TARGET=https://pre-api.example.com
PROD_API_PROXY_TARGET=https://api.example.com
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

将配置的产物目录（默认 `framework/`）中的内容部署到静态服务器，访问前缀为 `/framework/`。

- `config/config.ts` 中的 `base` 和 `publicPath` 均为 `/framework/`，服务器需要将静态资源映射到该路径。
- 项目使用 browser history 路由，刷新或直接访问业务页面时，服务器需回退到应用入口 HTML。
- 如需修改部署前缀，应同步修改配置和代码中的 Logo、图片、加载脚本等资源路径。
- DEV 与 UAT 共用 `/api/` 代理，目标通过 `UAT_API_PROXY_TARGET` 配置。代理仅作用于本地启动服务；线上部署需由服务器配置反向代理。

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
pnpm deadcode      # 未使用文件与导出检查（需先完成一次打包）
pnpm format        # 格式化项目文件
pnpm format:check  # 检查文件格式
```

如果类型检查提示缺少 `src/.umi/tsconfig.json`，先执行 `pnpm setup` 生成临时文件，再重新检查。
