import { expect, test } from '@playwright/test';

test('性能统计展示真实采集、持久化异常和导出数据', async ({ page }) => {
  await page.goto('/framework/monitoring/query');
  await expect(page.getByText('当前数据范围：此浏览器')).toBeVisible();
  await expect(page.getByText('monitoring.started', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: '刷新', exact: true }).click();
  await expect(page.getByRole('cell', { name: /ROUTE_PAINT_ESTIMATE/ })).toBeVisible();

  await page.evaluate(() => {
    window.dispatchEvent(
      new ErrorEvent('error', { message: 'preview failed token=private-value user@example.com' }),
    );
  });
  await page.reload();
  await page.getByRole('tab', { name: /日志与异常/ }).click();
  await expect(
    page.getByText('preview failed token=[filtered] [email]', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('private-value', { exact: false })).toHaveCount(0);
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出 JSON' }).click();
  expect((await downloaded).suggestedFilename()).toMatch(/^performance-.*\.json$/);
});

test('前一天记录生成日报，无上报目标时保持待上报，刷新不重复生成', async ({ page }) => {
  await page.goto('/framework/monitoring/query');
  await expect(page.getByText('当前数据范围：此浏览器')).toBeVisible();
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('framework-monitoring-v1', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction('events', 'readwrite');
        transaction.objectStore('events').put({
          id: 'e2e-yesterday',
          visitId: 'e2e-visit',
          timestamp: Date.now() - 86400_000,
          updatedAt: Date.now(),
          environment: 'dev',
          release: 'test',
          route: '/framework/users/accounts',
          kind: 'vital',
          name: 'LCP',
          value: 1200,
          unit: 'ms',
          rating: 'good',
        });
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.getByRole('button', { name: '检查并补报' }).click();
  await page.getByRole('tab', { name: '每日上报', exact: true }).click();
  await expect(page.getByRole('cell', { name: '待上报', exact: true })).toHaveCount(1);
  await expect(page.getByRole('cell', { name: '未配置上报目标', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '检查并补报' }).click();
  await page.getByRole('tab', { name: '每日上报', exact: true }).click();
  await expect(page.getByRole('cell', { name: '待上报', exact: true })).toHaveCount(1);
});

test('小屏可查看统计卡片，宽表在容器内滚动', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/framework/monitoring/query');
  await expect(page.getByText('当前数据范围：此浏览器')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('性能统计为目录菜单，包含独立的统计概览与数据查询页面', async ({ page }) => {
  await page.goto('/framework/monitoring');
  await expect(page).toHaveURL(/\/framework\/monitoring\/overview$/);
  await expect(page.getByText('当前数据范围：此浏览器')).toBeVisible();
  await expect(page.getByText('每日性能趋势', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: '刷新', exact: true }).click();
  await page.locator('[aria-label="分析指标"]').click();
  await page.getByTitle('ROUTE_PAINT_ESTIMATE', { exact: true }).click();
  await expect(
    page.getByRole('img', { name: /ROUTE_PAINT_ESTIMATE 每日性能分位数趋势/ }),
  ).toBeVisible();
  await expect(page.locator('svg').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/monitoring-overview.png', fullPage: true });
  await page.getByRole('link', { name: '数据查询', exact: true }).click();
  await expect(page).toHaveURL(/\/framework\/monitoring\/query$/);
  await expect(page.getByRole('tab', { name: /采集明细/ })).toBeVisible();
});
