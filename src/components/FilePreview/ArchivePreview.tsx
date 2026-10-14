import { useState } from 'react';

import { Alert, App, Button, Table } from 'antd';
import JSZip, { type JSZipObject } from 'jszip';

import { downloadFile } from '@/utils/file';

import { readArchiveEntry } from './archive';
import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
import { usePreview } from './usePreview';

async function loadArchive(file: File) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  return Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function ArchivePreview({
  file,
  onOpenFile,
}: {
  file: File;
  onOpenFile: (file: File) => void;
}) {
  const state = usePreview(file, loadArchive);
  const [busy, setBusy] = useState<string>();
  const { message } = App.useApp();
  async function extract(entry: JSZipObject, preview: boolean) {
    setBusy(entry.name);
    try {
      const bytes = await readArchiveEntry(entry);
      const extracted = new File([bytes], entry.name.split('/').pop() || entry.name);
      if (preview) {
        onOpenFile(extracted);
      } else {
        downloadFile(extracted);
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '无法读取压缩条目。');
    } finally {
      setBusy(undefined);
    }
  }
  if (!state) {
    return <PreviewLoading />;
  }
  if (state.error) {
    return <PreviewError message={state.error} />;
  }
  return (
    <>
      <p className={styles.note}>
        共 {state.value?.length || 0} 个文件，可预览或单独下载压缩包内的文件。
      </p>
      {(state.value?.length || 0) > 1000 && (
        <Alert type="info" title="仅展示前 1000 个条目，完整压缩包请下载查看。" />
      )}
      <Table<JSZipObject>
        rowKey="name"
        size="small"
        dataSource={state.value?.slice(0, 1000)}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 500 }}
        columns={[
          {
            title: '文件路径',
            dataIndex: 'name',
            render: (name: string) => <span className={styles.filename}>{name}</span>,
          },
          {
            title: '操作',
            width: 160,
            render: (_, entry) => (
              <>
                <Button
                  type="link"
                  disabled={Boolean(busy)}
                  loading={busy === entry.name}
                  onClick={() => extract(entry, true)}
                >
                  预览
                </Button>
                <Button type="link" disabled={Boolean(busy)} onClick={() => extract(entry, false)}>
                  下载
                </Button>
              </>
            ),
          },
        ]}
      />
    </>
  );
}
