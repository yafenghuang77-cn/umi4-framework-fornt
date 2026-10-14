import { useMemo, useState } from 'react';

import { renderAsync } from 'docx-preview';

import { MAX_OFFICE_SIZE } from '@/utils/file';

import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
import PreviewPagination from './PreviewPagination';
import { usePreview } from './usePreview';

async function loadWord(file: File) {
  if (file.size > MAX_OFFICE_SIZE) {
    throw new Error('Word 预览限 20 MB，请下载后打开。');
  }
  const body = document.createElement('div');
  const style = document.createElement('div');
  await renderAsync(await file.arrayBuffer(), body, style, {
    useBase64URL: true,
    renderAltChunks: false,
    ignoreWidth: true,
    breakPages: true,
    ignoreLastRenderedPageBreak: false,
  });
  const pages = body.querySelectorAll<HTMLElement>('.docx-wrapper > section.docx');
  if (!pages.length) {
    throw new Error('文档中没有可显示的页面。');
  }
  pages.forEach((page, index) => {
    page.dataset.previewPage = String(index + 1);
  });
  return { body: body.innerHTML, styles: style.innerHTML, pages: pages.length };
}

export default function WordPreview({ file }: { file: File }) {
  const state = usePreview(file, loadWord);
  const [page, setPage] = useState(1);
  const document = state?.value;
  const current = Math.min(page, document?.pages || 1);
  // 保留插件生成的文档结构和样式，仅显示当前页；切换不重新解析 DOCX。
  const srcDoc = useMemo(
    () =>
      document
        ? `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline';"><style>body{margin:0;font-family:system-ui}img{max-width:100%}.docx-wrapper{padding:16px!important}section.docx{max-width:100%;box-sizing:border-box}.docx-wrapper>section.docx[data-preview-page]:not([data-preview-page="${current}"]){display:none!important}</style>${document.styles}</head><body>${document.body}</body></html>`
        : undefined,
    [document, current],
  );
  if (!state) {
    return <PreviewLoading />;
  }
  if (state.error) {
    return <PreviewError message={state.error} />;
  }
  return (
    <>
      <PreviewPagination
        label="Word "
        current={current}
        total={document?.pages || 0}
        onChange={setPage}
      />
      <iframe
        className={styles.documentFrame}
        title={`Word 预览：${file.name}`}
        sandbox=""
        srcDoc={srcDoc}
      />
      <p className={styles.note}>分页按文档保存的分页位置显示。</p>
    </>
  );
}
