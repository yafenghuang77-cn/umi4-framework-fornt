import { type IApi } from '@umijs/max';
import { cp, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

export default function pdfAssets(api: IApi) {
  api.onGenerateFiles(async ({ isFirstTime }) => {
    if (!isFirstTime) {
      return;
    }
    // 从 react-pdf 自身解析 PDF.js，避免 pnpm 下的幽灵依赖及 worker 版本错配。
    const requireFromApp = createRequire(join(api.cwd, 'package.json'));
    const requireFromPdf = createRequire(requireFromApp.resolve('react-pdf'));
    const packagePath = requireFromPdf.resolve('pdfjs-dist/package.json');
    const source = dirname(packagePath);
    const { version } = JSON.parse(await readFile(packagePath, 'utf8')) as { version: string };
    const destination = join(api.cwd, 'public/pdfjs', version);
    await mkdir(destination, { recursive: true });
    await cp(join(source, 'build/pdf.worker.min.mjs'), join(destination, 'pdf.worker.min.mjs'));
    for (const directory of ['cmaps', 'standard_fonts', 'wasm']) {
      await cp(join(source, directory), join(destination, directory), { recursive: true });
    }
    await cp(join(source, 'LICENSE'), join(destination, 'LICENSE'));
  });
}
