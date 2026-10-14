import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FilePreview from '@/components/FilePreview';
import { loadRemoteFile } from '@/utils/file';

jest.mock('@/utils/file', () => ({
  ...jest.requireActual('@/utils/file'),
  loadRemoteFile: jest.fn(),
}));

const remoteLoader = jest.mocked(loadRemoteFile);

beforeEach(() => {
  remoteLoader.mockReset();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: jest.fn(() => 'blob:preview-test'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: jest.fn() });
});

test('不传文件展示空状态，File 输入直接预览且无需加载 URL', async () => {
  const { rerender } = render(<FilePreview />);
  expect(screen.getByText('请选择文件，或传入文件链接')).toBeInTheDocument();
  rerender(<FilePreview file={new File(['hello'], 'hello.png')} />);
  expect(await screen.findByRole('img', { name: 'hello.png' })).toBeInTheDocument();
  expect(remoteLoader).not.toHaveBeenCalled();
});

test('URL 加载失败后可重试，组件将 fileName 传给加载器', async () => {
  remoteLoader
    .mockRejectedValueOnce(new Error('HTTP 503'))
    .mockResolvedValueOnce(new File(['hello'], 'report.png'));
  render(<FilePreview url="https://example.com/download" fileName="report.png" />);
  expect(await screen.findByText('HTTP 503')).toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole('button', { name: '重新加载' }));
  expect(await screen.findByRole('img', { name: 'report.png' })).toBeInTheDocument();
  expect(remoteLoader).toHaveBeenLastCalledWith(
    'https://example.com/download',
    'report.png',
    expect.any(AbortSignal),
  );
});

test('切换 URL 会取消旧请求，旧响应不能覆盖新文件', async () => {
  let resolveOld: (file: File) => void = () => undefined;
  remoteLoader
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    )
    .mockResolvedValueOnce(new File(['new'], 'new.png'));
  const { rerender, unmount } = render(<FilePreview url="https://example.com/old.png" />);
  const oldSignal = remoteLoader.mock.calls[0][2];
  rerender(<FilePreview url="https://example.com/new.png" />);
  expect(await screen.findByRole('img', { name: 'new.png' })).toBeInTheDocument();
  expect(oldSignal.aborted).toBe(true);
  resolveOld(new File(['old'], 'old.png'));
  await waitFor(() =>
    expect(screen.queryByRole('img', { name: 'old.png' })).not.toBeInTheDocument(),
  );
  unmount();
  expect(remoteLoader.mock.calls[1][2].aborted).toBe(true);
});

test('切换同名、同大小和同修改时间的 File 对象会重置预览错误并释放 URL', async () => {
  const oldFile = new File(['a'], 'image.png', { lastModified: 1 });
  const newFile = new File(['b'], 'image.png', { lastModified: 1 });
  const { rerender, unmount } = render(<FilePreview file={oldFile} />);
  fireEvent.error(await screen.findByRole('img', { name: 'image.png' }));
  expect(screen.getByText('无法预览此文件')).toBeInTheDocument();
  rerender(<FilePreview file={newFile} />);
  expect(await screen.findByRole('img', { name: 'image.png' })).toBeInTheDocument();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});
