import { useState } from 'react';

import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';

import {
  type DailyReport,
  flushMonitoring,
  type MetricSummary,
  monitoringConfig,
  type MonitoringEvent,
} from '@/utils/monitoring';
import { isSentryReady } from '@/utils/monitoring/sentry';

import MonitoringFilters from './Filters';
import styles from './index.less';
import { useMonitoringData } from './useMonitoringData';

const metricNames: Record<string, string> = {
  LCP: '最大内容绘制',
  INP: '交互响应',
  CLS: '布局偏移',
  FCP: '首次内容绘制',
  TTFB: '首字节响应',
  ROUTE_PAINT_ESTIMATE: '路由通知后绘制估算',
};
const formatValue = (value: number, unit: string) =>
  unit === 'score' ? value.toFixed(3) : `${Math.round(value).toLocaleString()} ms`;
const formatTime = (time: number) =>
  new Date(time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });
const reportStatus = {
  pending: '待上报',
  uploaded: '接口已确认',
  'sentry-submitted': '已提交 Sentry SDK',
};

export default function MonitoringPage() {
  const { message } = App.useApp();
  const data = useMonitoringData();
  const { source, dates, busy, refresh, events, metrics, reports } = data;
  const [uploading, setUploading] = useState(false);
  const logs = events
    .filter((event) => event.kind === 'log' || event.kind === 'error')
    .sort((a, b) => b.timestamp - a.timestamp);
  const vitals = events.filter((event) => event.kind === 'vital');

  async function upload() {
    setUploading(true);
    try {
      await flushMonitoring();
      await refresh();
      message.info('已检查上报队列，请在日报表中查看确认状态。当天日报在次日生成。');
    } catch {
      message.error('上报检查失败，数据保留在本地，请稍后重试。');
    } finally {
      setUploading(false);
    }
  }

  function exportData() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            source,
            environment: monitoringConfig.environment,
            events,
            reports,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `performance-${dates[0]}-${dates[1]}.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const metricColumns = [
    {
      title: '指标',
      key: 'name',
      render: (_: unknown, item: MetricSummary) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text strong>{item.name}</Typography.Text>
          <Typography.Text type="secondary">
            {metricNames[item.name] || '业务 / 请求耗时'}
          </Typography.Text>
        </Space>
      ),
    },
    { title: '页面', dataIndex: 'route', key: 'route', ellipsis: true },
    { title: '版本', dataIndex: 'release', key: 'release' },
    {
      title: '样本数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: MetricSummary, b: MetricSummary) => a.count - b.count,
    },
    ...(['p50', 'p75', 'p95'] as const).map((field) => ({
      title: field.toUpperCase(),
      key: field,
      render: (_: unknown, item: MetricSummary) => formatValue(item[field], item.unit),
    })),
    {
      title: '良好占比',
      key: 'goodRate',
      render: (_: unknown, item: MetricSummary) =>
        item.goodRate === undefined ? (
          '—'
        ) : (
          <Progress percent={Math.round(item.goodRate * 100)} size="small" />
        ),
    },
  ];

  return (
    <PageContainer
      title="数据查询"
      content="查看加载、交互、接口耗时与运行日志。日期按北京时间统计。"
    >
      <div className={styles.page}>
        <MonitoringFilters
          data={data}
          actions={
            <>
              <Button
                icon={<DownloadOutlined aria-hidden="true" />}
                onClick={exportData}
                disabled={!events.length && !reports.length}
              >
                导出 JSON
              </Button>
              <Button
                type="primary"
                icon={<UploadOutlined aria-hidden="true" />}
                loading={uploading}
                onClick={() => void upload()}
                disabled={!monitoringConfig.enabled}
              >
                检查并补报
              </Button>
            </>
          }
        />
        <Row gutter={[16, 16]}>
          {[
            ['采集记录', events.length, '指标、请求与日志'],
            ['文档性能样本', vitals.length, 'LCP / INP / CLS / FCP / TTFB'],
            ['异常记录', events.filter((event) => event.kind === 'error').length, '捕获的异常事件'],
            [
              '待上报日报',
              reports.filter((report) => report.status === 'pending').length,
              '不包含尚未结束的今天',
            ],
          ].map(([title, value, description]) => (
            <Col xs={24} sm={12} xl={6} key={String(title)}>
              <Card>
                <Statistic title={title} value={value} />
                <Typography.Text type="secondary">{description}</Typography.Text>
              </Card>
            </Col>
          ))}
        </Row>
        <Card>
          <Tabs
            items={[
              {
                key: 'events',
                label: `采集明细 (${events.length})`,
                children: (
                  <Table<MonitoringEvent>
                    rowKey="id"
                    dataSource={[...events].sort((a, b) => b.timestamp - a.timestamp)}
                    loading={busy}
                    scroll={{ x: 1150 }}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    expandable={{
                      expandedRowRender: (item) => (
                        <pre className={styles.logMessage}>
                          {JSON.stringify(
                            {
                              visitId: item.visitId,
                              attributes: item.attributes,
                              message: item.message,
                            },
                            null,
                            2,
                          )}
                        </pre>
                      ),
                    }}
                    columns={[
                      {
                        title: '时间（北京时间）',
                        key: 'timestamp',
                        width: 190,
                        render: (_, item) => formatTime(item.timestamp),
                      },
                      {
                        title: '类型',
                        dataIndex: 'kind',
                        width: 100,
                        filters: [
                          { text: 'Web Vitals', value: 'vital' },
                          { text: '业务耗时', value: 'measure' },
                          { text: '网络请求', value: 'request' },
                          { text: '日志', value: 'log' },
                          { text: '异常', value: 'error' },
                        ],
                        onFilter: (value, item) => item.kind === value,
                      },
                      {
                        title: '指标 / 事件',
                        dataIndex: 'name',
                        width: 220,
                        filterSearch: true,
                        filters: [...new Set(events.map((item) => item.name))].map((name) => ({
                          text: name,
                          value: name,
                        })),
                        onFilter: (value, item) => item.name === value,
                      },
                      { title: '页面', dataIndex: 'route', width: 220, ellipsis: true },
                      {
                        title: '值',
                        key: 'value',
                        width: 130,
                        render: (_, item) =>
                          item.value === undefined
                            ? '—'
                            : formatValue(item.value, item.unit || 'ms'),
                      },
                      {
                        title: '状态',
                        key: 'status',
                        width: 120,
                        render: (_, item) =>
                          item.rating ||
                          item.attributes?.status ||
                          (item.kind === 'request'
                            ? item.attributes?.failed
                              ? '失败'
                              : '成功'
                            : item.level || '—'),
                      },
                      { title: '版本', dataIndex: 'release', width: 140 },
                    ]}
                  />
                ),
              },
              {
                key: 'metrics',
                label: '性能指标',
                children: (
                  <>
                    <Typography.Paragraph type="secondary">
                      分位数按页面、指标和版本分别计算。路由绘制估算不等于业务可用；INP
                      需要真实交互，LCP / CLS 等可能在页面隐藏后才完成上报，缺失值不补零。
                    </Typography.Paragraph>
                    <Table<MetricSummary>
                      rowKey="key"
                      columns={metricColumns}
                      dataSource={metrics}
                      loading={busy}
                      scroll={{ x: 1080 }}
                      pagination={{ pageSize: 10, showSizeChanger: true }}
                    />
                  </>
                ),
              },
              {
                key: 'logs',
                label: `日志与异常 (${logs.length})`,
                children: (
                  <Table<MonitoringEvent>
                    rowKey="id"
                    dataSource={logs}
                    expandable={{
                      expandedRowRender: (item) => (
                        <pre className={styles.logMessage}>
                          {JSON.stringify(item.attributes || {}, null, 2)}
                        </pre>
                      ),
                    }}
                    scroll={{ x: 850 }}
                    pagination={{ pageSize: 10 }}
                    columns={[
                      {
                        title: '时间（北京时间）',
                        key: 'time',
                        width: 190,
                        render: (_, item) => formatTime(item.timestamp),
                      },
                      {
                        title: '级别',
                        key: 'level',
                        width: 90,
                        render: (_, item) => (
                          <Tag
                            color={
                              item.level === 'error'
                                ? 'red'
                                : item.level === 'warn'
                                  ? 'orange'
                                  : 'blue'
                            }
                          >
                            {item.level || item.kind}
                          </Tag>
                        ),
                      },
                      { title: '页面', dataIndex: 'route', width: 220 },
                      {
                        title: '消息',
                        key: 'message',
                        render: (_, item) => (
                          <div className={styles.logMessage}>{item.message || item.name}</div>
                        ),
                      },
                    ]}
                  />
                ),
              },
              {
                key: 'daily',
                label: '每日上报',
                children: (
                  <>
                    <Typography.Paragraph type="secondary">
                      每天 00:00
                      后首次检查生成前一天汇总，页面运行期间每分钟检查，重新打开时补报。“已提交
                      Sentry SDK”表示 SDK
                      队列已处理，不等同于服务端持久化确认。日报按日期汇总，不受页面筛选影响。
                    </Typography.Paragraph>
                    <Table<DailyReport>
                      rowKey="id"
                      dataSource={reports}
                      scroll={{ x: 900 }}
                      pagination={{ pageSize: 10 }}
                      columns={[
                        { title: '日期', dataIndex: 'date' },
                        { title: '记录数', dataIndex: 'eventCount' },
                        { title: '异常数', dataIndex: 'errorCount' },
                        {
                          title: '状态',
                          key: 'status',
                          render: (_, item) => (
                            <Tag color={item.status === 'pending' ? 'orange' : 'green'}>
                              {reportStatus[item.status]}
                            </Tag>
                          ),
                        },
                        {
                          title: '提交时间',
                          key: 'uploadedAt',
                          render: (_, item) =>
                            item.uploadedAt ? formatTime(item.uploadedAt) : '—',
                        },
                        {
                          title: '最近失败原因',
                          key: 'error',
                          render: (_, item) =>
                            item.lastError ||
                            (item.status === 'pending' &&
                            !monitoringConfig.ingestUrl &&
                            !isSentryReady()
                              ? '未配置上报目标'
                              : '—'),
                        },
                      ]}
                    />
                  </>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </PageContainer>
  );
}
