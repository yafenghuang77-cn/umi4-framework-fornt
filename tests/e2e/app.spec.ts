import { expect, test } from '@playwright/test';

test('登录页校验必填字段', async ({ page }) => {
  await page.goto('/framework/user/login');
  await expect(page.getByRole('heading', { name: '登录工作台' })).toBeVisible();
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page.getByText('请输入账号', { exact: true })).toBeVisible();
  await expect(page.getByText('请输入密码', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/framework\/user\/login$/);
});

test('使用后端登录响应进入首页，退出后清除凭证并回到登录页', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    expect(route.request().method()).toBe('POST');
    expect(route.request().postDataJSON()).toEqual({
      username: 'playwright_user',
      password: 'test-password',
    });
    expect(route.request().headers().authorization).toBeUndefined();
    await route.fulfill({
      json: {
        success: true,
        errCode: '0',
        errMessage: '成功',
        data: {
          tokenName: 'Authorization',
          tokenPrefix: 'Bearer',
          tokenValue: 'test-token',
          timeout: 7200,
          user: { id: 7, username: 'playwright_user', createdAt: '2026-10-21T12:00:00' },
        },
      },
    });
  });
  await page.goto('/framework/user/login');
  await page.getByLabel('账号', { exact: true }).fill('playwright_user');
  await page.getByLabel('密码', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/framework\/welcome$/);
  await expect(page.getByRole('button', { name: '用户菜单' })).toContainText('playwright_user');
  expect(await page.evaluate(() => localStorage.getItem('framework:token'))).toBe('test-token');
  await page.getByRole('button', { name: '用户菜单' }).click();
  await page.getByRole('menuitem', { name: '退出登录' }).click();
  await expect(page).toHaveURL(/\/framework\/user\/login$/);
  await expect(page.getByRole('heading', { name: '登录工作台' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('framework:token'))).toBeNull();
});

for (const status of [200, 400]) {
  test(`登录失败展示后端 errMessage（HTTP ${status}）且不建立会话`, async ({ page }) => {
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status,
        json: { success: false, errCode: '10002', errMessage: '用户名或密码错误', data: null },
      }),
    );
    await page.goto('/framework/user/login');
    await page.getByLabel('账号', { exact: true }).fill('alice');
    await page.getByLabel('密码', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: '登录', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('用户名或密码错误');
    await expect(page).toHaveURL(/\/framework\/user\/login$/);
    expect(await page.evaluate(() => localStorage.getItem('framework:token'))).toBeNull();
  });
}

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
