import ColorSwatchPicker from '@components/ColorSwatchPicker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider } from 'antd';

test('颜色选择器展示当前选择，并在用户点击后通知调用方', async () => {
  const user = userEvent.setup();
  const onChange = jest.fn();
  const options = [
    { label: '蓝色', value: '#1677ff' },
    { label: '绿色', value: '#52c41a' },
  ];
  const { rerender } = render(
    <ColorSwatchPicker label="主题颜色" options={options} value="#1677ff" onChange={onChange} />,
    {
      // 此用例验证选色行为，关闭按钮波纹动画，避免装饰性定时器影响测试退出。
      wrapper: ({ children }) => (
        <ConfigProvider wave={{ disabled: true }}>{children}</ConfigProvider>
      ),
    },
  );

  expect(screen.getByRole('group', { name: '主题颜色' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '主题颜色：蓝色' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await user.click(screen.getByRole('button', { name: '主题颜色：绿色' }));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith('#52c41a');

  rerender(
    <ColorSwatchPicker label="主题颜色" options={options} value="#52c41a" onChange={onChange} />,
  );
  expect(screen.getByRole('button', { name: '主题颜色：绿色' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(screen.getByRole('button', { name: '主题颜色：蓝色' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});
