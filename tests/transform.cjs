const { createHash } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { createConfig } = require('@umijs/max/test');
const ts = require('typescript');

const [transformerPath, transformerOptions] = createConfig({
  jsTransformer: 'esbuild',
  jsTransformerOpts: { jsx: 'automatic' },
}).transform['^.+\\.(t|j)sx?$'];
const transformer = require(transformerPath).default.createTransformer(transformerOptions);
const adapterSource = readFileSync(__filename);

module.exports = {
  ...transformer,
  getCacheKey(...args) {
    return createHash('sha256')
      .update(transformer.getCacheKey(...args))
      .update(adapterSource)
      .update(ts.version)
      .digest('hex');
  },
  process(source, filename, options) {
    let code = source;
    // Umi 的 Mock 提升步骤先运行 Babel；预先移除类型，避免内联 type 导入解析失败。
    if (/\.tsx?$/.test(filename) && /jest\.(?:mock|doMock)\(/.test(source)) {
      code = ts.transpileModule(source, {
        fileName: filename,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.Preserve,
          inlineSourceMap: true,
          inlineSources: true,
        },
      }).outputText;
    }
    return transformer.process(code, filename, options);
  },
};
