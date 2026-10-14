import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';

import {
  monitoringConfig,
  type MonitoringSnapshot,
  queryMonitoring,
  readSnapshot,
  shanghaiDate,
  summarize,
} from '@/utils/monitoring';

const emptySnapshot: MonitoringSnapshot = { events: [], reports: [] };

export function useMonitoringData() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [source, setSource] = useState<'local' | 'server'>('local');
  const [dates, setDates] = useState<[string, string]>([
    dayjs(shanghaiDate()).subtract(6, 'day').format('YYYY-MM-DD'),
    shanghaiDate(),
  ]);
  const [route, setRoute] = useState('all');
  const [release, setRelease] = useState('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<number>();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setBusy(true);
    try {
      const data =
        source === 'local' ? await readSnapshot() : await queryMonitoring(dates[0], dates[1]);
      if (generation.current !== current) {
        return;
      }
      setSnapshot(data);
      setError('');
      setUpdatedAt(Date.now());
    } catch (failure) {
      if (generation.current === current) {
        setSnapshot(emptySnapshot);
        setError(failure instanceof Error ? failure.message : '读取统计数据失败');
      }
    } finally {
      if (generation.current === current) {
        setBusy(false);
      }
    }
  }, [source, dates]);

  useEffect(() => {
    void refresh();
    const invalidate = () => {
      generation.current++;
    };
    const timer = autoRefresh
      ? window.setInterval(() => {
          if (document.visibilityState === 'visible') {
            void refresh();
          }
        }, 10_000)
      : undefined;
    return () => {
      clearInterval(timer);
      invalidate();
    };
  }, [refresh, autoRefresh]);

  const events = useMemo(
    () =>
      snapshot.events.filter((event) => {
        const date = shanghaiDate(event.timestamp);
        return (
          event.environment === monitoringConfig.environment &&
          date >= dates[0] &&
          date <= dates[1] &&
          (route === 'all' || event.route === route) &&
          (release === 'all' || event.release === release)
        );
      }),
    [snapshot, dates, route, release],
  );
  const metrics = useMemo(() => summarize(events), [events]);
  const reports = snapshot.reports
    .filter(
      (report) =>
        report.environment === monitoringConfig.environment &&
        report.date >= dates[0] &&
        report.date <= dates[1],
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const environmentEvents = snapshot.events.filter(
    (event) => event.environment === monitoringConfig.environment,
  );
  const routes = [...new Set(environmentEvents.map((event) => event.route))].sort();
  const releases = [...new Set(environmentEvents.map((event) => event.release))].sort();

  function changeSource(value: 'local' | 'server') {
    setSnapshot(emptySnapshot);
    setRoute('all');
    setRelease('all');
    setSource(value);
  }

  return {
    snapshot,
    source,
    setSource: changeSource,
    dates,
    setDates,
    route,
    setRoute,
    release,
    setRelease,
    busy,
    error,
    updatedAt,
    autoRefresh,
    setAutoRefresh,
    refresh,
    events,
    metrics,
    reports,
    routes,
    releases,
  };
}

export type MonitoringData = ReturnType<typeof useMonitoringData>;
