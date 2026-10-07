# Nginx 部署说明

本项目部署在 `/framework/` 路径下，采用“原文件 + 同名 `.gz` 文件”的发布方式。客户端支持 gzip 时，Nginx 优先返回 `.gz`；没有对应 `.gz` 或客户端不支持 gzip 时，返回原文件。页面中的资源地址仍使用 `.js`、`.css` 等原始后缀。

## 1. 构建产物

根据发布环境执行对应命令：

| 环境 | 命令              |
| ---- | ----------------- |
| UAT  | `pnpm build:uat`  |
| PRE  | `pnpm build:pre`  |
| PROD | `pnpm build:prod` |

默认输出到项目根目录的 `framework/`。输出目录通过 `.env` 中的变量配置，仅 build 阶段生效：

```dotenv
BUILD_OUTPUT_PATH=framework
```

该值为项目内的相对目录，不能指向项目根目录或项目外目录。改变磁盘输出目录不会改变访问前缀；当前 `base`、`publicPath` 仍为 `/framework/`。

```text
framework/
├── index.html
├── index.html.gz
├── js/
│   ├── umi.<hash>.js
│   ├── umi.<hash>.js.gz
│   ├── loading.js
│   └── loading.js.gz
├── css/
│   ├── <name>.<hash>.css
│   └── <name>.<hash>.css.gz
├── user/login/index.html
├── user/login/index.html.gz
└── …其他路由页面、图片及必要资源
```

构建在所有路由 HTML 生成完成后执行发布处理：

- 对 JS、CSS、HTML、SVG、JSON、TXT、XML 使用 gzip 级别 9 生成同名 `.gz`。
- 压缩后体积更大的小文件只保留原文件，不生成 `.gz`。
- 关闭构建 Source Map，并清理残留 `.map`、`stats.json`。
- 保留原文件、图片、字体、业务 JSON、许可证及路由 HTML；不要自行删除这些文件。
- 原文件与 `.gz` 保持相同修改时间。

各环境的本地开发服务仍保留开发源码映射。打包后的 Knip 检查只报告未使用代码，不会删除源文件。

## 2. 上传要求

将输出目录内的完整产物上传，保留目录结构、原文件与 `.gz` 的对应关系。示例将 `framework/` 上传到服务器的 `/srv/www/`，最终文件位置为 `/srv/www/framework/index.html`。

无需上传项目源码、`node_modules`、配置目录和锁文件。Nginx 运行用户需有发布文件的读取权限及父目录的访问权限。上传工具建议保留文件修改时间。

发布前确认对应环境的接口地址。Umi 的 `proxy` 只用于本地开发服务，部署后不会自动成为 Nginx 的接口代理；同源 API 需要在现有站点中另行配置后端反向代理。

## 3. Nginx 配置

Nginx 必须包含 `http_gzip_static_module`。在服务器执行以下命令查看构建参数中是否有 `--with-http_gzip_static_module`：

```bash
nginx -V
```

以下是 HTTP 站点示例，放在 Nginx `http` 上下文加载的站点配置文件中。将域名、磁盘目录和 `mime.types` 路径替换为服务器实际值；已有 HTTPS 站点可合并 gzip 和 location 配置，保留已有 TLS 设置。

```nginx
server {
    listen 80;
    server_name example.com;

    # URL /framework/js/app.js 对应 /srv/www/framework/js/app.js。
    root /srv/www;
    index index.html;
    include /etc/nginx/mime.types;

    # 客户端支持 gzip 且同名 .gz 存在时，优先返回预压缩文件。
    gzip_static on;
    gzip_vary on;

    location = /framework {
        return 301 /framework/;
    }

    # 静态资源不存在时返回 404，避免将 HTML 当成 JS/CSS 返回。
    location ~* ^/framework/.*\.(js|css|svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|woff2?|ttf)$ {
        try_files $uri =404;
    }

    # HTML 每次重新校验，避免长期缓存旧页面入口。
    location ~* ^/framework/.*\.html$ {
        add_header Cache-Control "no-cache";
        try_files $uri =404;
    }

    # 支持访问 /framework/ 及直接刷新前端路由。
    location /framework/ {
        try_files $uri $uri/ /framework/index.html;
    }
}
```

`root` 应为 `framework` 的父目录，不要写成 `/srv/www/framework`，否则路径会重复。这里使用 `gzip_static on`，无需 `gzip_static always` 或 `gunzip on`，也无需将页面资源 URL 改成 `.gz`。本例不依赖动态 gzip。

修改后先检查语法，检查通过再重新加载：

```bash
sudo nginx -t && sudo nginx -s reload
```

## 4. 部署验证

以下示例使用 HTTPS；按实际站点协议和域名替换 URL。

验证客户端支持 gzip 时优先返回 `.gz`：

```bash
curl -I -H 'Accept-Encoding: gzip' https://example.com/framework/js/loading.js
```

预期返回 `200`，包含 `Content-Encoding: gzip` 和 `Vary: Accept-Encoding`。`Content-Type` 应为 JavaScript 类型。

验证原文件回退：

```bash
curl -I -H 'Accept-Encoding: identity' https://example.com/framework/js/loading.js
```

预期返回 `200`，不包含 `Content-Encoding: gzip`。没有 `.gz` 的资源也应能通过原 URL 正常访问。

最后在浏览器访问并刷新 `/framework/user/login`、`/framework/users/accounts`，确认页面正常显示、JS/CSS 无 404。访问 `/framework/js/not-found.js` 应返回 404，而不是页面 HTML。

如果未命中 gzip，检查模块是否存在、配置是否重新加载、同名 `.gz` 是否上传，以及响应是否经过了其他代理或 CDN。若出现 `unknown directive "gzip_static"`，需要使用包含静态 gzip 模块的 Nginx 构建。

## 5. 官方参考

- [Nginx 静态 gzip：模块要求、读取条件及修改时间建议](https://nginx.org/en/docs/http/ngx_http_gzip_static_module.html)
- [Nginx try_files：文件查找及路由回退](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
