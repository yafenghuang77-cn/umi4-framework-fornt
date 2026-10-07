import { type IApi } from '@umijs/max';
import { readdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { gzipSync } from 'node:zlib';

export default function prepareDeploy(api: IApi) {
  // 此阶段所有路由 HTML 已生成，直接使用 Umi 解析后的输出路径。
  api.onBuildHtmlComplete(async () => {
    const outputPath = api.paths.absOutputPath;
    let compressedCount = 0;
    let removedCount = 0;

    async function prepareDirectory(directory: string) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
          await prepareDirectory(path);
          continue;
        }
        if (!entry.isFile()) {
          continue;
        }
        // 仅清理明确的调试产物，保留业务 JSON、图片和许可证。
        if (entry.name.endsWith('.map') || entry.name === 'stats.json') {
          await rm(path);
          removedCount += 1;
          continue;
        }
        if (!['.js', '.css', '.html', '.svg', '.json', '.txt', '.xml'].includes(extname(path))) {
          continue;
        }

        let content = await readFile(path);
        if (/\.(?:js|css)$/.test(path)) {
          const source = content.toString('utf8');
          const cleaned = source
            .replace(/\/\/[#@]\s*sourceMappingURL=[^\r\n]*(?:\r?\n|$)/g, '')
            .replace(/\/\*[#@]\s*sourceMappingURL=[\s\S]*?\*\//g, '');
          if (cleaned !== source) {
            content = Buffer.from(cleaned);
            await writeFile(path, content);
          }
        }
        const compressed = gzipSync(content, { level: 9 });
        // 小文件压缩后反而更大时，继续使用原文件。
        if (compressed.length < content.length) {
          const gzipPath = `${path}.gz`;
          await writeFile(gzipPath, compressed);
          const { atime, mtime } = await stat(path);
          await utimes(gzipPath, atime, mtime);
          compressedCount += 1;
        }
      }
    }

    await prepareDirectory(outputPath);
    api.logger.info(
      `发布产物准备完成：生成 ${compressedCount} 个 gzip 文件，清理 ${removedCount} 个调试文件。`,
    );
  });
}
