import { useState } from 'react';

import { Alert, Empty } from 'antd';
import JSZip, { type JSZipObject } from 'jszip';

import { MAX_OFFICE_SIZE, MAX_TEXT_SIZE } from '@/utils/file';

import { readArchiveEntry } from './archive';
import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
import PreviewPagination from './PreviewPagination';
import { usePreview } from './usePreview';

async function loadSlides(file: File) {
  if (file.size > MAX_OFFICE_SIZE) {
    throw new Error('PPTX 预览限 20 MB，请下载后打开。');
  }
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const parser = new DOMParser();
  const presentation = zip.file('ppt/presentation.xml');
  const relationships = zip.file('ppt/_rels/presentation.xml.rels');
  if (!presentation || !relationships) {
    throw new Error('此文件不是有效的 PPTX 演示文稿。');
  }
  const readXml = async (entry: JSZipObject) =>
    parser.parseFromString(
      new TextDecoder().decode(await readArchiveEntry(entry, MAX_TEXT_SIZE)),
      'application/xml',
    );
  const document = await readXml(presentation);
  const rels = await readXml(relationships);
  const targets = new Map(
    Array.from(rels.getElementsByTagName('Relationship')).map((rel) => [
      rel.getAttribute('Id'),
      rel.getAttribute('Target'),
    ]),
  );
  const slideIds = Array.from(document.getElementsByTagNameNS('*', 'sldId'));
  const slides: string[][] = [];
  for (const slide of slideIds.slice(0, 200)) {
    const target = targets.get(slide.getAttribute('r:id'));
    const path = target?.startsWith('/') ? target.slice(1) : `ppt/${target}`;
    const entry = zip.file(path);
    if (!entry) {
      throw new Error('无法读取幻灯片内容。');
    }
    const xml = await readXml(entry);
    slides.push(
      Array.from(xml.getElementsByTagNameNS('*', 'p'))
        .map((paragraph) =>
          Array.from(paragraph.getElementsByTagNameNS('*', 't'))
            .map((node) => node.textContent || '')
            .join(''),
        )
        .filter(Boolean),
    );
  }
  return { slides, truncated: slideIds.length > 200 };
}

export default function PresentationPreview({ file }: { file: File }) {
  const state = usePreview(file, loadSlides);
  const [page, setPage] = useState(1);
  if (!state) {
    return <PreviewLoading />;
  }
  if (state.error) {
    return <PreviewError message={state.error} />;
  }
  const slides = state.value?.slides || [];
  return (
    <>
      <Alert
        type="info"
        showIcon
        title="PPTX 文本预览"
        description={`展示每页文字内容，原始排版、图片、图表及动画请下载查看。${state.value?.truncated ? '仅展示前 200 页。' : ''}`}
      />
      {slides.length ? (
        <>
          <PreviewPagination
            label="PPTX "
            current={page}
            total={slides.length}
            onChange={setPage}
          />
          <div className={styles.slide}>
            {slides[page - 1]?.length ? (
              slides[page - 1].map((text, index) => <p key={index}>{text}</p>)
            ) : (
              <Empty description="此页没有可提取的文字" />
            )}
          </div>
        </>
      ) : (
        <Empty description="演示文稿没有幻灯片" />
      )}
    </>
  );
}
