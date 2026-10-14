import { useState } from 'react';

import { PageContainer } from '@ant-design/pro-components';
import { Alert, Card, Col, Empty, Row, Select, Space, Statistic, theme, Typography } from 'antd';
import dayjs from 'dayjs';

import { percentile, shanghaiDate } from '@/utils/monitoring/aggregate';

import MonitoringChart from './Chart';
import MonitoringFilters from './Filters';
import styles from './index.less';
import { useMonitoringData } from './useMonitoringData';

const vitalLabels: Record<string, string> = {
  LCP: '最大内容绘制',
  INP: '交互响应',
  CLS: '布局偏移',
  FCP: '首次内容绘制',
  TTFB: '首字节响应',
};
const thresholds: Record<string, number> = { LCP: 2500, INP: 200, CLS: 0.1, FCP: 1800, TTFB: 800 };

export default function MonitoringOverview() {
  const data = useMonitoringData();
  const { token } = theme.useToken();
  const [metric, setMetric] = useState('LCP');
  const { events, dates } = data;
  const unit = metric === 'CLS' ? 'score' : 'ms';
  const samples = events.filter(
    (event) =>
      event.name === metric &&
      typeof event.value === 'number' &&
      (event.kind !== 'measure' ||
        !event.attributes?.status ||
        event.attributes.status === 'success'),
  );
  const days = Array.from(
    { length: dayjs(dates[1]).diff(dayjs(dates[0]), 'day') + 1 },
    (_, index) => dayjs(dates[0]).add(index, 'day').format('YYYY-MM-DD'),
  );
  const daily = days.map((date) => {
    const values = samples
      .filter((event) => shanghaiDate(event.timestamp) === date)
      .map((event) => event.value!);
    return { date, values };
  });
  const options = [
    ...new Set([
      ...Object.keys(vitalLabels),
      ...events.filter((event) => event.value !== undefined).map((event) => event.name),
    ]),
  ];
  const rated = samples.filter((event) => event.rating);
  const distribution = [
    {
      name: '良好',
      value: rated.filter((event) => event.rating === 'good').length,
      itemStyle: { color: token.colorSuccess },
    },
    {
      name: '需要改进',
      value: rated.filter((event) => event.rating === 'needs-improvement').length,
      itemStyle: { color: token.colorWarning },
    },
    {
      name: '较差',
      value: rated.filter((event) => event.rating === 'poor').length,
      itemStyle: { color: token.colorError },
    },
  ];
  const routeGroups = new Map<string, number[]>();
  samples.forEach((event) => {
    const values = routeGroups.get(event.route) || [];
    values.push(event.value!);
    routeGroups.set(event.route, values);
  });
  const ranking = [...routeGroups]
    .map(([route, values]) => ({ route, count: values.length, p75: percentile(values, 0.75) }))
    .sort((a, b) => b.p75 - a.p75)
    .slice(0, 10)
    .reverse();
  const requests = events.filter((event) => event.kind === 'request');
  const failedRequests = requests.filter((event) => event.attributes?.failed === true);
  const dailyRequests = days.map((date) => ({
    count: requests.filter((event) => shanghaiDate(event.timestamp) === date).length,
    failed: failedRequests.filter((event) => shanghaiDate(event.timestamp) === date).length,
    errors: events.filter(
      (event) => event.kind === 'error' && shanghaiDate(event.timestamp) === date,
    ).length,
  }));
  const axis = {
    axisLabel: { color: token.colorTextSecondary },
    axisLine: { lineStyle: { color: token.colorBorder } },
    splitLine: { lineStyle: { color: token.colorBorderSecondary } },
  };
  const empty = (description: string) => (
    <div className={styles.emptyChart}>
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />
    </div>
  );
  const selectedP75 = samples.length
    ? percentile(
        samples.map((event) => event.value!),
        0.75,
      )
    : undefined;

  return (
    <PageContainer
      title="统计概览"
      content="通过图表查看性能趋势、体验分布与页面排行；数据按北京时间统计。"
    >
      <div className={styles.page}>
        <MonitoringFilters data={data} />
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic title="采集记录" value={events.length} />
              <Typography.Text type="secondary">当前筛选范围</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title={`${metric} · P75`}
                value={selectedP75 ?? '—'}
                precision={selectedP75 === undefined ? undefined : unit === 'score' ? 3 : 0}
                suffix={unit === 'ms' && selectedP75 !== undefined ? 'ms' : undefined}
              />
              <Typography.Text type="secondary">{samples.length} 个样本</Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="接口失败率"
                value={requests.length ? (failedRequests.length / requests.length) * 100 : '—'}
                precision={requests.length ? 1 : undefined}
                suffix={requests.length ? '%' : undefined}
              />
              <Typography.Text type="secondary">
                {failedRequests.length} / {requests.length} 次网络请求
              </Typography.Text>
            </Card>
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <Card>
              <Statistic
                title="异常记录"
                value={events.filter((event) => event.kind === 'error').length}
              />
              <Typography.Text type="secondary">捕获的异常事件数</Typography.Text>
            </Card>
          </Col>
        </Row>
        <Card size="small">
          <Space wrap>
            <Typography.Text strong>分析指标</Typography.Text>
            <Select
              className={styles.metricSelect}
              aria-label="分析指标"
              value={metric}
              onChange={setMetric}
              options={options.map((name) => ({
                label: `${name}${vitalLabels[name] ? ` · ${vitalLabels[name]}` : ''}`,
                value: name,
              }))}
            />
            <Typography.Text type="secondary">
              同一指标独立统计，不混合毫秒和布局偏移分数。全部版本选项会合并版本样本。
            </Typography.Text>
          </Space>
        </Card>
        <Card
          title={`${metric} 每日性能趋势`}
          extra={
            <Typography.Text type="secondary">
              P50 / P75 / P95 · {unit === 'score' ? '分数' : '毫秒'}
            </Typography.Text>
          }
        >
          {samples.length ? (
            <MonitoringChart
              description={`${metric} 每日性能分位数趋势，共 ${samples.length} 个样本。${daily.map((item) => `${item.date}：${item.values.length} 个样本${item.values.length ? `，P75 ${percentile(item.values, 0.75).toFixed(unit === 'score' ? 3 : 0)}` : ''}`).join('；')}`}
              option={{
                tooltip: { trigger: 'axis' },
                legend: {
                  top: 0,
                  data: ['P50', 'P75', 'P95'],
                  textStyle: { color: token.colorText },
                },
                grid: { left: 56, right: 28, top: 48, bottom: 36 },
                xAxis: {
                  ...axis,
                  type: 'category',
                  data: days.map((day) => day.slice(5)),
                  boundaryGap: false,
                },
                yAxis: { ...axis, type: 'value', name: unit === 'score' ? '分数' : 'ms' },
                series: (
                  [
                    ['P50', 0.5],
                    ['P75', 0.75],
                    ['P95', 0.95],
                  ] as const
                ).map(([name, fraction]) => ({
                  name,
                  type: 'line',
                  connectNulls: false,
                  data: daily.map((item) =>
                    item.values.length ? percentile(item.values, fraction) : null,
                  ),
                  symbolSize: 7,
                  lineStyle: { width: name === 'P75' ? 3 : 2 },
                  markLine:
                    name === 'P75' && thresholds[metric] !== undefined
                      ? {
                          silent: true,
                          symbol: 'none',
                          data: [{ yAxis: thresholds[metric], name: '良好参考' }],
                          label: { formatter: '良好参考 {c}' },
                          lineStyle: { color: token.colorSuccess },
                        }
                      : undefined,
                })),
              }}
            />
          ) : (
            empty(`暂未采集到 ${metric}；可切换指标，或浏览业务页面后刷新。`)
          )}
        </Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={10}>
            <Card title={`${metric} 体验分布`}>
              {rated.length ? (
                <MonitoringChart
                  description={`${metric} 体验分布：${distribution.map((item) => `${item.name} ${item.value} 个`).join('，')}`}
                  option={{
                    tooltip: { trigger: 'item' },
                    legend: { bottom: 0, textStyle: { color: token.colorText } },
                    series: [
                      {
                        type: 'pie',
                        radius: ['42%', '68%'],
                        center: ['50%', '44%'],
                        data: distribution,
                        label: { formatter: '{b}\n{c} 个 · {d}%', color: token.colorText },
                      },
                    ],
                  }}
                />
              ) : (
                empty('当前指标没有体验评级样本；业务耗时不套用 Web Vitals 评级。')
              )}
            </Card>
          </Col>
          <Col xs={24} xl={14}>
            <Card title={`${metric} 页面耗时排行 · Top 10`}>
              {ranking.length ? (
                <MonitoringChart
                  description={`${metric} 页面 P75 排行：${ranking.map((item) => `${item.route} ${item.p75.toFixed(unit === 'score' ? 3 : 0)} ${unit}，${item.count} 个样本`).join('；')}`}
                  option={{
                    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                    grid: { left: 12, right: 45, top: 12, bottom: 28, containLabel: true },
                    xAxis: { ...axis, type: 'value', name: unit },
                    yAxis: {
                      ...axis,
                      type: 'category',
                      data: ranking.map((item) => item.route),
                      axisLabel: {
                        color: token.colorTextSecondary,
                        width: 160,
                        overflow: 'truncate',
                      },
                    },
                    series: [
                      {
                        type: 'bar',
                        name: 'P75',
                        barMaxWidth: 28,
                        data: ranking.map((item) => item.p75),
                        label: {
                          show: true,
                          position: 'right',
                          color: token.colorText,
                          formatter: (params: { value: unknown }) =>
                            Number(params.value).toFixed(unit === 'score' ? 3 : 0),
                        },
                      },
                    ],
                  }}
                />
              ) : (
                empty('暂无可排行的性能样本。')
              )}
            </Card>
          </Col>
        </Row>
        <Card
          title="接口与异常趋势"
          extra={<Typography.Text type="secondary">单位：次 / 条</Typography.Text>}
        >
          {requests.length || events.some((event) => event.kind === 'error') ? (
            <MonitoringChart
              description={days
                .map(
                  (date, index) =>
                    `${date}：请求 ${dailyRequests[index].count} 次，失败 ${dailyRequests[index].failed} 次，异常 ${dailyRequests[index].errors} 条`,
                )
                .join('；')}
              option={{
                tooltip: { trigger: 'axis' },
                legend: {
                  top: 0,
                  data: ['网络请求', '失败请求', '异常记录'],
                  textStyle: { color: token.colorText },
                },
                grid: { left: 50, right: 24, top: 48, bottom: 32 },
                xAxis: { ...axis, type: 'category', data: days.map((day) => day.slice(5)) },
                yAxis: { ...axis, type: 'value', minInterval: 1 },
                series: [
                  {
                    type: 'bar',
                    name: '网络请求',
                    data: dailyRequests.map((item) => item.count),
                    barMaxWidth: 24,
                  },
                  {
                    type: 'line',
                    name: '失败请求',
                    data: dailyRequests.map((item) => item.failed),
                    itemStyle: { color: token.colorWarning },
                  },
                  {
                    type: 'line',
                    name: '异常记录',
                    data: dailyRequests.map((item) => item.errors),
                    itemStyle: { color: token.colorError },
                  },
                ],
              }}
            />
          ) : (
            empty('尚无网络请求或异常记录。')
          )}
        </Card>
        <Alert
          showIcon
          type="info"
          title="统计口径"
          description="缺少样本的性能趋势保留断点，不补零；当天数据尚未结束。首次文档指标和路由绘制估算含义不同，业务可用耗时需要主动埋点。少量样本的分位数仅供观察。"
        />
      </div>
    </PageContainer>
  );
}
