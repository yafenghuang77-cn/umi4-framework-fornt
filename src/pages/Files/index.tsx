import { useState } from 'react';

import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileOutlined,
  InboxOutlined,
  LinkOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components';
import {
  Alert,
  App,
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Upload,
  type UploadFile,
} from 'antd';

import FilePreview from '@/components/FilePreview';
import {
  downloadFile,
  FILE_KIND_LABELS,
  type FileKind,
  formatFileSize,
  getFileKind,
  MAX_FILE_SIZE,
} from '@/utils/file';

import styles from './index.less';

interface LibraryFile {
  id: string;
  name: string;
  kind: FileKind;
  size?: number;
  importedAt: number;
  file?: File;
  url?: string;
}

export default function Files() {
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [search, setSearch] = useState<{ name?: string; kind?: FileKind }>({});
  const [preview, setPreview] = useState<LibraryFile>();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadFile[]>([]);
  const [linkOpen, setLinkOpen] = useState(false);
  const [form] = Form.useForm<{ url: string; fileName?: string }>();
  const { message } = App.useApp();

  function closeUpload() {
    setUploadOpen(false);
    setPendingFiles([]);
  }

  function submitFiles() {
    const selected = pendingFiles.flatMap((entry) =>
      entry.originFileObj ? [entry.originFileObj] : [],
    );
    if (!selected.length) {
      message.warning('请先选择文件');
      return;
    }
    setFiles((current) => [
      ...current,
      ...selected.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        kind: getFileKind(file),
        size: file.size,
        importedAt: Date.now(),
        file,
      })),
    ]);
    closeUpload();
    message.success(`已添加 ${selected.length} 个文件`);
  }

  const columns: Array<ProColumns<LibraryFile>> = [
    {
      title: '文件名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, item) => (
        <Space>
          <FileOutlined aria-hidden="true" />
          <Button type="link" className={styles.fileName} onClick={() => setPreview(item)}>
            {item.name}
          </Button>
        </Space>
      ),
    },
    {
      title: '文件类型',
      dataIndex: 'kind',
      width: 150,
      valueEnum: Object.fromEntries(
        Object.entries(FILE_KIND_LABELS).map(([key, text]) => [key, { text }]),
      ),
      render: (_, item) => <Tag>{FILE_KIND_LABELS[item.kind]}</Tag>,
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      width: 110,
      search: false,
      render: (_, item) => (item.size === undefined ? '链接文件' : formatFileSize(item.size)),
    },
    {
      title: '导入时间',
      dataIndex: 'importedAt',
      valueType: 'dateTime',
      width: 180,
      search: false,
      sorter: (a, b) => a.importedAt - b.importedAt,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      render: (_, item) => [
        <Button
          key="preview"
          type="link"
          icon={<EyeOutlined aria-hidden="true" />}
          onClick={() => setPreview(item)}
        >
          预览
        </Button>,
        item.file ? (
          <Button
            key="download"
            type="link"
            icon={<DownloadOutlined aria-hidden="true" />}
            onClick={() => item.file && downloadFile(item.file)}
          >
            下载
          </Button>
        ) : null,
        <Popconfirm
          key="remove"
          title="从当前列表移除此文件？"
          onConfirm={() => setFiles((current) => current.filter((entry) => entry.id !== item.id))}
          okText="移除"
          cancelText="取消"
        >
          <Button type="link" danger icon={<DeleteOutlined aria-hidden="true" />}>
            移除
          </Button>
        </Popconfirm>,
      ],
    },
  ];
  const filtered = files.filter(
    (item) =>
      (!search.name || item.name.toLowerCase().includes(search.name.trim().toLowerCase())) &&
      (!search.kind || item.kind === search.kind),
  );

  return (
    <PageContainer title="文件列表">
      <ProTable<LibraryFile>
        rowKey="id"
        headerTitle={`文件列表（${files.length}）`}
        columns={columns}
        dataSource={filtered}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        onSubmit={(values) => setSearch(values)}
        onReset={() => setSearch({})}
        options={{ reload: false, density: true, setting: true, fullScreen: true }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        scroll={{ x: 800 }}
        toolBarRender={() => [
          <Button
            key="link"
            icon={<LinkOutlined aria-hidden="true" />}
            onClick={() => setLinkOpen(true)}
          >
            添加文件链接
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined aria-hidden="true" />}
            onClick={() => setUploadOpen(true)}
          >
            新增文件
          </Button>,
        ]}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={files.length ? '没有匹配的文件' : '暂无文件，点击“新增文件”添加'}
            />
          ),
        }}
      />
      <Drawer
        title="新增文件"
        open={uploadOpen}
        onClose={closeUpload}
        size="min(560px, 100vw)"
        destroyOnHidden
        footer={
          <Space>
            <Button onClick={closeUpload} aria-label="取消新增文件">
              取消
            </Button>
            <Button type="primary" onClick={submitFiles} disabled={!pendingFiles.length}>
              确认添加
            </Button>
          </Space>
        }
      >
        <Alert
          className={styles.notice}
          type="info"
          showIcon
          title="文件在当前浏览器内预览，不上传至服务器；离开页面或刷新后，本次添加的列表会清空。"
        />
        <Upload.Dragger
          className={styles.importer}
          multiple
          fileList={pendingFiles}
          onChange={({ fileList }) => setPendingFiles(fileList)}
          beforeUpload={(file) => {
            if (file.size > MAX_FILE_SIZE) {
              message.error(`${file.name} 超过 50 MB，请重新选择。`);
              return Upload.LIST_IGNORE;
            }
            return false;
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined aria-hidden="true" />
          </p>
          <p className="ant-upload-text">点击选择文件，或将文件拖到这里</p>
          <p className="ant-upload-hint">支持多文件选择，单个文件最大 50 MB</p>
          <p className="ant-upload-hint">
            PDF · DOCX · XLSX / CSV · 图片 · 音视频 · Markdown / 文本 · ZIP · PPTX 文本
          </p>
        </Upload.Dragger>
      </Drawer>
      <Modal
        title="文件预览"
        open={Boolean(preview)}
        onCancel={() => setPreview(undefined)}
        width="min(1200px, calc(100vw - 32px))"
        destroyOnHidden
        footer={<Button onClick={() => setPreview(undefined)}>关闭</Button>}
      >
        {preview && (
          <FilePreview
            key={preview.id}
            file={preview.file}
            url={preview.url}
            fileName={preview.name}
          />
        )}
      </Modal>
      <Modal
        title="添加文件链接"
        open={linkOpen}
        onCancel={() => {
          setLinkOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="添加并预览"
        cancelText="取消"
        destroyOnHidden
      >
        <Alert
          className={styles.notice}
          type="info"
          showIcon
          title="链接需直接返回文件内容，跨域链接需要服务端允许跨域访问。"
        />
        <Form
          form={form}
          layout="vertical"
          onFinish={({ url, fileName }) => {
            const address = new URL(url.trim());
            let name = address.pathname.split('/').pop() || '未命名文件';
            try {
              name = decodeURIComponent(name);
            } catch {
              /* 使用原始名称。 */
            }
            const item: LibraryFile = {
              id: crypto.randomUUID(),
              name: fileName?.trim() || name,
              url: address.href,
              kind: getFileKind({ name: fileName?.trim() || name, type: '' }),
              importedAt: Date.now(),
            };
            setFiles((current) => [...current, item]);
            setPreview(item);
            setLinkOpen(false);
            form.resetFields();
          }}
        >
          <Form.Item
            name="url"
            label="文件 URL"
            rules={[
              { required: true, message: '请输入文件链接' },
              {
                validator: (_, value: string) => {
                  try {
                    const url = new URL(value?.trim());
                    return ['http:', 'https:'].includes(url.protocol)
                      ? Promise.resolve()
                      : Promise.reject(new Error('仅支持 HTTP / HTTPS 链接'));
                  } catch {
                    return Promise.reject(new Error('请输入有效的 HTTP / HTTPS 链接'));
                  }
                },
              },
            ]}
          >
            <Input placeholder="https://example.com/document.pdf" />
          </Form.Item>
          <Form.Item
            name="fileName"
            label="文件名（可选）"
            extra="下载链接没有扩展名时，请填写带扩展名的文件名，例如 report.docx。"
          >
            <Input placeholder="保留原文件名" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
