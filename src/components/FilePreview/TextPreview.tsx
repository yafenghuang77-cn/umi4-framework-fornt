import MDEditor from '@uiw/react-md-editor';
import { theme } from 'antd';

import { getFileKind, MAX_TEXT_SIZE } from '@/utils/file';

import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
import { usePreview } from './usePreview';

async function loadText(file: File) {
  if (file.size > MAX_TEXT_SIZE) {
    throw new Error('文本预览限 2 MB，请下载查看完整内容。');
  }
  const text = await file.text();
  if (text.includes('\u0000')) {
    throw new Error('此文件包含二进制内容或使用非 UTF-8 编码，请转换编码后预览。');
  }
  return text;
}

export default function TextPreview({ file }: { file: File }) {
  const state = usePreview(file, loadText);
  const { token } = theme.useToken();
  if (!state) {
    return <PreviewLoading />;
  }
  if (state.error) {
    return <PreviewError message={state.error} />;
  }
  if (getFileKind(file) === 'markdown') {
    return (
      <div
        className={styles.markdown}
        data-color-mode={token.colorBgBase === '#000' ? 'dark' : 'light'}
      >
        <MDEditor.Markdown
          source={state.value || ''}
          skipHtml
          // 禁止 raw HTML 插件，只渲染 Markdown 节点。
          pluginsFilter={(type, plugins) => (type === 'rehype' ? [] : plugins)}
          components={{
            img: ({ src, alt }) => (
              <img
                src={src}
                alt={alt || 'Markdown 图片'}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ),
            a: ({ href, children }) => (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            ),
          }}
        />
      </div>
    );
  }
  return (
    <pre className={styles.text}>
      <code>{state.value || '（空文件）'}</code>
    </pre>
  );
}
