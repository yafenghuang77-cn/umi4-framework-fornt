import { useEffect, useRef } from 'react';

import { theme } from 'antd';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components';
import { type EChartsCoreOption, init, use as registerCharts } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';

import styles from './index.less';

registerCharts([
  BarChart,
  LineChart,
  PieChart,
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
  SVGRenderer,
]);

export default function MonitoringChart({
  option,
  description,
}: {
  option: EChartsCoreOption;
  description: string;
}) {
  const element = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<typeof init> | undefined>(undefined);
  const { token } = theme.useToken();
  useEffect(() => {
    if (!element.current) {
      return undefined;
    }
    const instance = init(element.current, undefined, { renderer: 'svg' });
    chart.current = instance;
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      instance.dispose();
      chart.current = undefined;
    };
  }, []);
  useEffect(() => {
    chart.current?.setOption(
      {
        ...option,
        animation: false,
        textStyle: { color: token.colorText, fontFamily: token.fontFamily },
        color: [token.colorPrimary, token.colorWarning, token.colorError, token.colorSuccess],
        aria: { enabled: true, label: { description } },
      },
      true,
    );
  }, [
    option,
    token.colorText,
    token.fontFamily,
    token.colorPrimary,
    token.colorWarning,
    token.colorError,
    token.colorSuccess,
    description,
  ]);
  return <div ref={element} className={styles.chart} role="img" aria-label={description} />;
}
