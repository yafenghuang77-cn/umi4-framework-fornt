import { useState } from 'react';

import { Alert, Empty, Table, Tabs } from 'antd';
import { type CellValue, Workbook } from 'exceljs';

import {
  getFileExtension,
  MAX_OFFICE_SIZE,
  MAX_PREVIEW_COLUMNS,
  MAX_PREVIEW_ROWS,
  MAX_TEXT_SIZE,
  parseDelimitedText,
} from '@/utils/file';

import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
import { usePreview } from './usePreview';

interface PreviewSheet {
  name: string;
  rows: string[][];
  truncated: boolean;
}

function cellText(value: CellValue): string {
  if (value == null) {
    return '';
  }
  if (value instanceof Date) {
    return value.toLocaleString('zh-CN');
  }
  if (typeof value !== 'object') {
    return String(value);
  }
  if ('richText' in value) {
    return value.richText.map((part) => part.text).join('');
  }
  if ('text' in value) {
    return value.text;
  }
  if ('error' in value) {
    return value.error;
  }
  if ('formula' in value || 'sharedFormula' in value) {
    return value.result == null ? `=${value.formula || '[共享公式]'}` : cellText(value.result);
  }
  return '';
}

async function loadSheets(file: File): Promise<PreviewSheet[]> {
  const extension = getFileExtension(file.name);
  if (
    ['csv', 'tsv'].includes(extension) ||
    ['text/csv', 'text/tab-separated-values'].includes(file.type)
  ) {
    if (file.size > MAX_TEXT_SIZE) {
      throw new Error('CSV / TSV 预览限 2 MB，请下载后打开。');
    }
    return [
      {
        name: file.name,
        ...parseDelimitedText(
          await file.text(),
          extension === 'tsv' || file.type === 'text/tab-separated-values' ? '\t' : ',',
        ),
      },
    ];
  }
  if (file.size > MAX_OFFICE_SIZE) {
    throw new Error('Excel 预览限 20 MB，请下载后打开。');
  }
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  return workbook.worksheets.map((sheet) => {
    const rowCount = Math.min(sheet.rowCount, MAX_PREVIEW_ROWS);
    const columnCount = Math.min(sheet.columnCount, MAX_PREVIEW_COLUMNS);
    return {
      name: sheet.name,
      rows: Array.from({ length: rowCount }, (_, rowIndex) =>
        Array.from({ length: columnCount }, (_, columnIndex) =>
          cellText(sheet.getCell(rowIndex + 1, columnIndex + 1).value),
        ),
      ),
      truncated: sheet.rowCount > MAX_PREVIEW_ROWS || sheet.columnCount > MAX_PREVIEW_COLUMNS,
    };
  });
}

function columnLabel(index: number): string {
  return index < 26
    ? String.fromCharCode(65 + index)
    : `${columnLabel(Math.floor(index / 26) - 1)}${columnLabel(index % 26)}`;
}

export default function SpreadsheetPreview({ file }: { file: File }) {
  const state = usePreview(file, loadSheets);
  const [active, setActive] = useState('0');
  if (!state) {
    return <PreviewLoading />;
  }
  if (state.error) {
    return <PreviewError message={state.error} />;
  }
  if (!state.value?.length) {
    return <Empty description="工作簿没有工作表" />;
  }
  const sheet = state.value[Number(active)] || state.value[0];
  const columns = Math.max(0, ...sheet.rows.map((row) => row.length));
  return (
    <>
      <Tabs
        activeKey={active}
        onChange={setActive}
        items={state.value.map((item, index) => ({ key: String(index), label: item.name }))}
      />
      {sheet.truncated && (
        <Alert type="info" showIcon title="仅展示前 500 行、100 列，完整内容请下载查看。" />
      )}
      {!sheet.rows.length ? (
        <Empty description="工作表为空" />
      ) : (
        <Table<{ id: number; cells: string[] }>
          key={active}
          rowKey="id"
          size="small"
          bordered
          dataSource={sheet.rows.map((cells, id) => ({ id, cells }))}
          pagination={{ defaultPageSize: 20, showSizeChanger: true }}
          scroll={{ x: 'max-content', y: 400 }}
          columns={[
            { title: '行号', dataIndex: 'id', width: 70, render: (id: number) => id + 1 },
            ...Array.from({ length: columns }, (_, index) => ({
              title: columnLabel(index),
              key: String(index),
              width: 160,
              className: styles.sheetCell,
              render: (_: unknown, row: { cells: string[] }) => row.cells[index] || '',
            })),
          ]}
        />
      )}
      <p className={styles.note}>
        表格展示单元格内容；公式使用文件中已保存的结果，不在浏览器内计算。
      </p>
    </>
  );
}
