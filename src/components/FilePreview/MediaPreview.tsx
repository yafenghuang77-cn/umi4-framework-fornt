import { useState } from 'react';

import { Image } from 'antd';

import { getFileKind } from '@/utils/file';

import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
import { useObjectUrl } from './usePreview';

export default function MediaPreview({ file }: { file: File }) {
  const url = useObjectUrl(file);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <PreviewError message="文件可能已损坏，或浏览器不支持此文件的编码，请下载后打开。" />;
  }
  if (!url) {
    return <PreviewLoading />;
  }
  const kind = getFileKind(file);
  return (
    <div className={styles.media}>
      {kind === 'image' ? (
        <Image src={url} alt={file.name} className={styles.image} onError={() => setFailed(true)} />
      ) : kind === 'audio' ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- 用户导入的音频没有字幕文件，保留浏览器原生控件。
        <audio
          controls
          preload="metadata"
          src={url}
          aria-label={`音频：${file.name}`}
          onError={() => setFailed(true)}
        />
      ) : (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- 用户导入的视频没有独立字幕文件，保留浏览器原生控件。
        <video
          controls
          preload="metadata"
          src={url}
          aria-label={`视频：${file.name}`}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
