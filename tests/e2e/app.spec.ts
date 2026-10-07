import { expect, test } from '@playwright/test';

test('登录页校验必填字段', async ({ page }) => {
  await page.goto('/framework/user/login');
  await expect(page.getByRole('heading', { name: '登录工作台' })).toBeVisible();
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByText('请输入账号', { exact: true })).toBeVisible();
  await expect(page.getByText('请输入密码', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/framework\/user\/login$/);
});

test('模拟登录后进入首页，退出后回到登录页', async ({ page }) => {
  await page.goto('/framework/user/login');
  await page.getByLabel('账号', { exact: true }).fill('playwright-user');
  await page.getByLabel('密码', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/framework\/welcome$/);
  await expect(page.getByRole('button', { name: '用户菜单' })).toContainText('playwright-user');
  await page.getByRole('button', { name: '用户菜单' }).click();
  await page.getByRole('menuitem', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/framework\/user\/login$/);
  await expect(page.getByRole('heading', { name: '登录工作台' })).toBeVisible();
});

test('直接访问并刷新用户账号页面', async ({ page }) => {
  await page.goto('/framework/users/accounts');
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('暂无用户账号', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByText('暂无用户账号', { exact: true })).toBeVisible();
});

test('品牌切换后刷新当前路由，并在再次刷新后保留选择', async ({ page }) => {
  await page.goto('/framework/users/accounts');
  await page.getByRole('button', { name: '切换品牌，当前品牌：KFC', exact: true }).click();
  await Promise.all([
    page.waitForEvent('framenavigated', { predicate: (frame) => frame === page.mainFrame() }),
    page.getByRole('menuitem', { name: 'PH', exact: true }).click(),
  ]);
  await expect(page).toHaveURL(/\/framework\/users\/accounts$/);
  await expect(
    page.getByRole('button', { name: '切换品牌，当前品牌：PH', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('button', { name: '切换品牌，当前品牌：PH', exact: true }),
  ).toBeVisible();
});
