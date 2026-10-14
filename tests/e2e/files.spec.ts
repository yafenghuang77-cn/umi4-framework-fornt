import { expect, type Page, test } from '@playwright/test';
import { Document, Packer, Paragraph } from 'docx';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts } from 'pdf-lib';

async function importAndPreview(
  page: Page,
  name: string,
  buffer: Buffer,
  mimeType = 'application/octet-stream',
) {
  await page.getByRole('button', { name: '新增文件', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: '新增文件', exact: true });
  await expect
    .poll(() => drawer.evaluate((element) => element.getBoundingClientRect().width))
    .toBeLessThanOrEqual(page.viewportSize()?.width || 1280);
  await drawer.locator('input[type="file"]').setInputFiles({ name, mimeType, buffer });
  await drawer.getByRole('button', { name: '确认添加', exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await page.getByRole('button', { name, exact: true }).click();
  return page.getByRole('dialog', { name: '文件预览', exact: true });
}

test('文件管理通过二级菜单进入列表，新增抽屉确认后才添加，取消清空待选文件', async ({ page }) => {
  await page.goto('/framework/files');
  await expect(page).toHaveURL(/\/framework\/files\/list$/);
  await expect(page.getByRole('menuitem', { name: /文件管理/ }).first()).toBeVisible();
  await expect(page.getByRole('menuitem', { name: '文件列表', exact: true })).toBeVisible();
  await expect(page.locator('main input[type="file"]')).toHaveCount(0);
  await page.getByRole('button', { name: '新增文件', exact: true }).click();
  const drawer = page.getByRole('dialog', { name: '新增文件', exact: true });
  await expect(drawer.getByRole('button', { name: '确认添加', exact: true })).toBeDisabled();
  await drawer.locator('input[type="file"]').setInputFiles({
    name: 'cancelled.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('cancelled'),
  });
  await expect(
    page.locator('main').getByRole('button', { name: 'cancelled.txt', exact: true }),
  ).toHaveCount(0);
  await drawer.getByRole('button', { name: '取消新增文件', exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await page.getByRole('button', { name: '新增文件', exact: true }).click();
  await expect(drawer.getByText('cancelled.txt', { exact: true })).toHaveCount(0);
  await drawer.locator('input[type="file"]').setInputFiles([
    { name: 'first.txt', mimeType: 'text/plain', buffer: Buffer.from('first') },
    { name: 'second.txt', mimeType: 'text/plain', buffer: Buffer.from('second') },
  ]);
  await drawer.getByRole('button', { name: '删除文件', exact: true }).first().click();
  await expect(drawer.getByText('first.txt', { exact: true })).toHaveCount(0);
  await drawer.getByRole('button', { name: '确认添加', exact: true }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'first.txt', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'second.txt', exact: true })).toBeVisible();
  await expect(page.getByText('文件列表（1）', { exact: true })).toBeVisible();
});

test('公共组件预览真实 PDF、DOCX、XLSX 文件', async ({ page }) => {
  await page.goto('/framework/files');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText('Hello PDF', { font });
  pdf.addPage().drawText('Second page', { font });
  let dialog = await importAndPreview(
    page,
    'sample.pdf',
    Buffer.from(await pdf.save()),
    'application/pdf',
  );
  await expect(dialog.getByText('Hello PDF', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(dialog.getByText('Second page', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '放大', exact: true }).click();
  await expect(dialog.getByText('125%')).toBeVisible();
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();

  const word = new Document({ sections: [{ children: [new Paragraph('Hello Word 文档预览')] }] });
  dialog = await importAndPreview(page, 'sample.docx', await Packer.toBuffer(word));
  await expect(
    page
      .frameLocator('iframe[title="Word 预览：sample.docx"]')
      .getByText('Hello Word 文档预览', { exact: true }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();

  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('销售表').addRows([
    ['产品', '数量'],
    ['咖啡', 12],
  ]);
  workbook.addWorksheet('汇总').addRow(['总计', { formula: '1+2', result: 3 }]);
  dialog = await importAndPreview(
    page,
    'sample.xlsx',
    Buffer.from(await workbook.xlsx.writeBuffer()),
  );
  await expect(dialog.getByRole('cell', { name: '咖啡', exact: true })).toBeVisible();
  await dialog.getByRole('tab', { name: '汇总', exact: true }).click();
  await expect(dialog.getByRole('cell', { name: '3', exact: true })).toBeVisible();
});

test('文本、Markdown、CSV 与 ZIP 条目预览及返回', async ({ page }) => {
  await page.goto('/framework/files');
  let dialog = await importAndPreview(
    page,
    'sample.csv',
    Buffer.from('name,note\r\nAlice,"a,b\n""quoted"""\r\n'),
  );
  await expect(dialog.getByRole('cell', { name: 'a,b\n"quoted"', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  dialog = await importAndPreview(
    page,
    'sample.md',
    Buffer.from(
      '# Markdown 预览\n\n**加粗内容**\n\n<script>window.__previewUnsafe = true</script>',
    ),
  );
  await expect(dialog.getByRole('heading', { name: 'Markdown 预览', exact: true })).toBeVisible();
  await expect(dialog.getByText('加粗内容', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => '__previewUnsafe' in window)).toBe(false);
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();

  const zip = new JSZip().file('notes/hello.txt', 'Hello from ZIP');
  dialog = await importAndPreview(
    page,
    'sample.zip',
    await zip.generateAsync({ type: 'nodebuffer' }),
  );
  await dialog.getByRole('button', { name: '预览', exact: true }).click();
  await expect(dialog.getByText('Hello from ZIP', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '返回压缩包', exact: true }).click();
  await expect(dialog.getByText('notes/hello.txt', { exact: true })).toBeVisible();
});

test('PPTX 按文稿顺序展示幻灯片文字', async ({ page }) => {
  await page.goto('/framework/files');
  const zip = new JSZip();
  zip.file(
    'ppt/presentation.xml',
    '<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId1"/></p:sldIdLst></p:presentation>',
  );
  zip.file(
    'ppt/_rels/presentation.xml.rels',
    '<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/><Relationship Id="rId2" Target="slides/slide2.xml"/></Relationships>',
  );
  for (const [id, text] of [
    [1, '第二页内容'],
    [2, '第一页内容'],
  ]) {
    zip.file(
      `ppt/slides/slide${id}.xml`,
      `<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:p><a:r><a:t>${text}</a:t></a:r></a:p></p:sld>`,
    );
  }
  const dialog = await importAndPreview(
    page,
    'sample.pptx',
    await zip.generateAsync({ type: 'nodebuffer' }),
  );
  await expect(dialog.getByText('第一页内容', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '下一页', exact: true }).click();
  await expect(dialog.getByText('第二页内容', { exact: true })).toBeVisible();
});

test('URL 预览支持文件名提示、失败重试和下载', async ({ page }) => {
  let requests = 0;
  await page.route('**/preview-download', async (route) => {
    requests += 1;
    await route.fulfill(
      requests === 1
        ? { status: 503 }
        : { status: 200, contentType: 'text/plain', body: 'Hello URL' },
    );
  });
  await page.goto('/framework/files');
  await page.getByRole('button', { name: '添加文件链接', exact: true }).click();
  await page
    .getByLabel('文件 URL', { exact: true })
    .fill(new URL('/preview-download', page.url()).href);
  await page.getByLabel('文件名（可选）', { exact: true }).fill('remote.txt');
  await page.getByRole('button', { name: '添加并预览', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '文件预览', exact: true });
  await expect(dialog.getByText('文件加载失败（HTTP 503）。', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '重新加载', exact: true }).click();
  await expect(dialog.getByText('Hello URL', { exact: true })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: '下载文件', exact: true }).click();
  expect((await downloadPromise).suggestedFilename()).toBe('remote.txt');
});

test('损坏和不支持的文件显示提示，文件列表支持搜索、移除', async ({ page }) => {
  await page.goto('/framework/files');
  let dialog = await importAndPreview(page, 'legacy.doc', Buffer.from('legacy'));
  await expect(dialog.getByText('此文件暂不支持在线预览', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  dialog = await importAndPreview(page, 'broken.docx', Buffer.from('broken'));
  await expect(dialog.getByText('无法预览此文件', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  await page.getByLabel('文件名称', { exact: true }).fill('legacy');
  await page.getByRole('button', { name: '查 询' }).click();
  await expect(page.getByRole('button', { name: 'broken.docx', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '移除', exact: true }).click();
  await page.getByRole('button', { name: '移 除', exact: true }).click();
  await expect(page.getByRole('button', { name: 'legacy.doc', exact: true })).toHaveCount(0);
});

test('小屏幕支持导入图片与原生音频播放器，页面不溢出', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/framework/files');
  const dialog = await importAndPreview(
    page,
    'pixel.png',
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=',
      'base64',
    ),
    'image/png',
  );
  await expect(dialog.getByRole('img', { name: 'pixel.png', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '关闭', exact: true }).click();
  // 真实的短 WAV 文件：8-bit PCM，8 kHz，单声道。
  const wav = Buffer.alloc(44 + 800);
  wav.write('RIFF');
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(8000, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(800, 40);
  wav.fill(128, 44);
  await importAndPreview(page, 'sample.wav', wav, 'audio/wav');
  await expect(page.locator('audio')).toHaveJSProperty('readyState', 4);
  await page
    .getByRole('dialog', { name: '文件预览', exact: true })
    .getByRole('button', { name: '关闭', exact: true })
    .click();
  const videoBytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    const chunks: Blob[] = [];
    return new Promise<number[]>((resolve, reject) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onerror = () => reject(new Error('无法生成测试视频'));
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));
      };
      recorder.start();
      canvas.getContext('2d')!.fillRect(0, 0, 32, 32);
      window.setTimeout(() => recorder.stop(), 300);
    });
  });
  await importAndPreview(page, 'sample.webm', Buffer.from(videoBytes), 'video/webm');
  await expect
    .poll(() => page.locator('video').evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
