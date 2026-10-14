import { renderAsync } from 'docx-preview';

import { MAX_OFFICE_SIZE } from '@/utils/file';

import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
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
  });
  // DOCX 内容在无脚本、无外部网络的 iframe 内渲染，样式不影响宿主页面。
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline';"><style>body{margin:0;font-family:system-ui}img{max-width:100%}.docx-wrapper{padding:16px!important}section.docx{max-width:100%;box-sizing:border-box}</style>${style.innerHTML}</head><body>${body.innerHTML}</body></html>`;
}

export default function WordPreview({ file }: { file: File }) {
  const state = usePreview(file, loadWord);
  if (!state) {
    return <PreviewLoading />;
  }
  if (state.error) {
    return <PreviewError message={state.error} />;
  }
  return (
    <iframe
      className={styles.documentFrame}
      title={`Word 预览：${file.name}`}
      sandbox=""
      srcDoc={state.value}
    />
  );
}
