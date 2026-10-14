import { type ReactNode } from 'react';

import { Button, InputNumber, Space } from 'antd';

import styles from './index.less';

interface PreviewPaginationProps {
  label: string;
  current: number;
  total: number;
  onChange: (page: number) => void;
  showJump?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export default function PreviewPagination({
  label,
  current,
  total,
  onChange,
  showJump = false,
  disabled = false,
  children,
}: PreviewPaginationProps) {
  const page = total > 0 ? Math.min(Math.max(1, current), total) : 0;
  function changePage(next: number) {
    if (!disabled && total > 0) {
      onChange(Math.min(Math.max(1, Math.trunc(next)), total));
    }
  }
  return (
    <Space wrap className={styles.toolbar} role="group" aria-label={`${label}分页`}>
      <Button disabled={disabled || page <= 1} onClick={() => changePage(page - 1)}>
        上一页
      </Button>
      <span role="status" aria-live="polite" aria-atomic="true">
        第 {page} / {total} 页
      </span>
      <Button disabled={disabled || !total || page >= total} onClick={() => changePage(page + 1)}>
        下一页
      </Button>
      {showJump && (
        <InputNumber
          aria-label={`${label}页码`}
          min={1}
          max={total || 1}
          precision={0}
          value={page || 1}
          disabled={disabled || !total}
          onChange={(value) => {
            if (value !== null) {
              changePage(value);
            }
          }}
        />
      )}
      {children}
    </Space>
  );
}
