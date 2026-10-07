# Ant Design Pro 布局骨架

基于现有 Umi Max 项目，实现 Ant Design Pro V6 风格的混合布局与欢迎页。

## 启动

```bash
pnpm install
pnpm dev
```

访问 http://localhost:8000/framework/welcome/ 。生产构建执行 `pnpm build`，部署目录为 `dist/`，部署前缀为 `/framework/`。

## 已实现

- ProLayout 顶部导航、可折叠侧栏、多级菜单、用户菜单和语言切换。
- 欢迎页的 2:1 内容布局、官方 Cheatsheet 横幅与资源入口；窄屏自动切换为单列。
- 首屏静态骨架屏、初始化骨架屏和路由懒加载骨架屏。
- SettingDrawer 布局设置、404 页面及业务页面占位。
- 用户账号与权限管理采用业务页面结构，不提供模拟账号或角色数据；权限资源直接读取实际路由配置。旧页面地址继续通过重定向访问。

## 主要文件

- `config/routes.ts`：逐项配置路由和菜单；侧栏保留首页、系统管理、用户管理三个一级菜单；配置管理包含基础配置、通知配置两个三级菜单。个人中心与个人设置通过顶部用户菜单访问。
- `config/defaultSettings.ts`：布局默认设置。
- `src/app.tsx`：顶部操作、用户菜单和设置抽屉。
- `src/pages/Home/`：欢迎页。
- `src/pages/Users/`：账号目录和筛选区。
- `src/pages/Permissions/`：角色管理与权限资源目录。
- `src/components/PageSkeleton/`、`src/loading.tsx`、`public/scripts/loading.js`：三个加载阶段的骨架屏。

使用 Ant Design 6 和 ProComponents `3.1.15-5`。ProComponents 3 是官方 Ant Design Pro V6 使用的组件系列，目前 npm 将该版本标记为 beta。设置抽屉用于预览，默认配置通过 `config/defaultSettings.ts` 保存。

参考：[官方预览](https://preview.pro.ant.design/welcome/)、[官方仓库](https://github.com/ant-design/ant-design-pro)。

## 代码规范

ESLint 保留 `extends: require.resolve('@umijs/max/eslint')` 作为基础规范，在原 `.eslintrc.js` 中叠加项目规则。Prettier、Stylelint 使用项目根目录的独立配置。提交钩子通过 `pnpm exec lint-staged` 检查暂存文件。

- `.eslintrc.js`：保留 Umi Max 基础规则并扩展项目规则。JavaScript 推荐规则、TypeScript 推荐规则与类型导入、禁止显式 any、未使用变量、React JSX、Hooks 和可访问性检查。自动导入顺序：副作用导入 → React → 第三方库 → `@/` 项目别名 → 相对路径 → 纯类型导入；组内排序并自动修复。
- `.prettierrc`：2 空格、单引号、分号、尾逗号、100 字符宽度、LF 换行。导入排序仅由 ESLint 负责。
- `.stylelintrc.js`：CSS/Less 标准规则、重复选择器和重复属性检查，支持 Tailwind 指令。允许 Ant Design 类名，不强制跨组件的选择器优先级顺序。
- 使用 ESLint 8.57.1 与 TypeScript 6.0.x，`pnpm typecheck` 直接调用 `tsc --noEmit`。
- `tsconfig.json` 保留 Umi 的 `extends`，补充严格模式、函数返回路径检查、禁止 switch 分支意外贯穿和文件名大小写一致性检查。未使用变量继续交给 ESLint。

```bash
pnpm lint         # 全量代码与样式检查
pnpm lint:fix     # 自动修复代码与样式
pnpm format       # 全量格式化
pnpm format:check # 格式检查
pnpm typecheck    # TypeScript 类型检查
```

风格参考 [Ant Design 配置](https://github.com/ant-design/ant-design/blob/master/biome.json) 与 [Umi Fabric](https://github.com/umijs/fabric)，采用严格但实用的项目规则；保留 ESLint 作为检查工具。ESLint 8 直接读取 `.eslintrc.js`，已删除 `eslint.config.mjs`。使用 Umi 提供的 `UMI_UTLINT_MIGRATE` 开关跳过旧插件解析补丁，命令行与编辑器统一从项目根目录解析插件。Umi 中已删除的旧规则以对应的新版规则替代。
