import { type ReactNode } from 'react';

import { ReloadOutlined } from '@ant-design/icons';
import { Alert, App, Button, Card, DatePicker, Select, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

import { getStorageError, monitoringConfig } from '@/utils/monitoring';
import { isSentryReady } from '@/utils/monitoring/sentry';

import styles from './index.less';
import { type MonitoringData } from './useMonitoringData';

export default function MonitoringFilters({
  data,
  actions,
}: {
  data: MonitoringData;
  actions?: ReactNode;
}) {
  const { message } = App.useApp();
  return (
    <>
      {!monitoringConfig.enabled && (
        <Alert showIcon type="warning" title="监控采集已关闭，当前仅展示历史数据。" />
      )}
      {getStorageError() && <Alert showIcon type="warning" title={getStorageError()} />}
      {data.error && <Alert showIcon type="error" title="数据读取失败" description={data.error} />}
      <Card size="small">
        <div className={styles.toolbar}>
          <Space wrap>
            <Select
              aria-label="数据来源"
              value={data.source}
              onChange={data.setSource}
              options={[
                { label: '此浏览器', value: 'local' },
                { label: '服务端', value: 'server', disabled: !monitoringConfig.queryUrl },
              ]}
            />
            <DatePicker.RangePicker
              aria-label="统计日期范围"
              allowClear={false}
              value={[dayjs(data.dates[0]), dayjs(data.dates[1])]}
              onChange={(range) => {
                if (!range?.[0] || !range[1]) {
                  return;
                }
                if (range[1].diff(range[0], 'day') > 29) {
                  message.warning('单次最多查询 30 天，请缩小日期范围。');
                  return;
                }
                data.setDates([range[0].format('YYYY-MM-DD'), range[1].format('YYYY-MM-DD')]);
              }}
            />
            <Select
              className={styles.routeSelect}
              aria-label="筛选页面"
              value={data.route}
              onChange={data.setRoute}
              options={[
                { label: '全部页面', value: 'all' },
                ...data.routes.map((path) => ({ label: path, value: path })),
              ]}
            />
            <Select
              aria-label="筛选版本"
              className={styles.versionSelect}
              value={data.release}
              onChange={data.setRelease}
              options={[
                { label: '全部版本', value: 'all' },
                ...data.releases.map((release) => ({ label: release, value: release })),
              ]}
            />
          </Space>
          <Space wrap>
            <Button
              icon={<ReloadOutlined aria-hidden="true" />}
              loading={data.busy}
              onClick={() => void data.refresh()}
            >
              刷新
            </Button>
            {actions}
          </Space>
        </div>
        <div className={styles.status}>
          <Space wrap>
            <Tag>
              {monitoringConfig.environment} / {monitoringConfig.release}
            </Tag>
            <Tag color={isSentryReady() ? 'green' : 'default'}>
              Sentry {isSentryReady() ? '已初始化' : '未配置 / 未启用'}
            </Tag>
            <Tag>统计接口{monitoringConfig.ingestUrl ? '已配置' : '未配置'}</Tag>
            <Typography.Text type="secondary">
              {data.updatedAt
                ? `更新于 ${new Date(data.updatedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`
                : '正在读取'}
            </Typography.Text>
            <Button type="link" size="small" onClick={() => data.setAutoRefresh(!data.autoRefresh)}>
              {data.autoRefresh ? '暂停自动刷新' : '启用自动刷新'}
            </Button>
          </Space>
        </div>
      </Card>
    </>
  );
}
