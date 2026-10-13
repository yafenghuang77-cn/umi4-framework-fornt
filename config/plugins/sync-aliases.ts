import { type IApi } from '@umijs/max';
import { isAbsolute, relative } from 'node:path';

/** 将项目配置的目录别名追加到 Umi 生成的 paths，保留框架和其他插件的映射。 */
export default function syncAliases(api: IApi) {
  api.modifyTSConfig((config) => {
    const paths: Record<string, string[]> = (config.compilerOptions.paths ??= {});
    const aliases = (api.userConfig.alias ?? {}) as Record<string, unknown>;

    for (const alias of Object.keys(aliases)) {
      const target: unknown = api.config.alias[alias];
      // 已有的 @、@@ 等映射由 Umi 维护；这里只同步绝对路径形式的目录别名。
      if (paths[`${alias}/*`] || typeof target !== 'string' || !isAbsolute(target)) {
        continue;
      }

      // paths 相对于生成的 tsconfig 所在目录解析，兼容开发和构建临时目录。
      const directory = relative(api.paths.absTmpPath, target).replaceAll('\\', '/') || '.';
      paths[alias] ??= [directory];
      paths[`${alias}/*`] = [`${directory}/*`];
    }

    return config;
  });
}
