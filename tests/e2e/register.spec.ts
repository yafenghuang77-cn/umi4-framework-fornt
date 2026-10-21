import { expect, test } from '@playwright/test';

test('从登录页进入注册页并校验必填字段', async ({ page }) => {
  await page.goto('/framework/user/login');
  await page.getByRole('link', { name: '注册账号', exact: true }).click();
  await expect(page).toHaveURL(/\/framework\/user\/register$/);
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await expect(page.getByText('请输入账号', { exact: true })).toBeVisible();
  await expect(page.getByText('请输入密码', { exact: true })).toBeVisible();
  await expect(page.getByText('请再次输入密码', { exact: true })).toBeVisible();
  await expect(page.getByLabel('账号', { exact: true })).toBeFocused();
});

test('注册校验账号与密码，成功后回填登录账号并完成登录', async ({ page }) => {
  const user = { id: 7, username: 'registered_user', createdAt: '2026-10-21T12:00:00' };
  await page.route('**/api/auth/register', async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      username: 'Registered_User',
      password: 'Register456',
    });
    expect(route.request().headers().authorization).toBeUndefined();
    await route.fulfill({ json: { success: true, errCode: '0', errMessage: '成功', data: user } });
  });
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      json: {
        success: true,
        errCode: '0',
        errMessage: '成功',
        data: {
          tokenName: 'Authorization',
          tokenPrefix: 'Bearer',
          tokenValue: 'registered-token',
          timeout: 7200,
          user,
        },
      },
    }),
  );
  await page.goto('/framework/user/register');
  await page.getByLabel('账号', { exact: true }).fill('ab');
  await page.getByLabel('密码', { exact: true }).fill('123');
  await page.getByLabel('确认密码', { exact: true }).fill('other-password');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await expect(page.getByText('账号需为 4–32 位字母、数字或下划线')).toBeVisible();
  await expect(page.getByText('密码长度需为 8–64 位')).toBeVisible();
  await expect(page.getByText('两次输入的密码不一致')).toBeVisible();

  await page.getByLabel('账号', { exact: true }).fill('Registered_User');
  await page.getByLabel('密码', { exact: true }).fill('Register123');
  await page.getByLabel('确认密码', { exact: true }).fill('Register123');
  // 修改原密码后，确认密码必须重新校验。
  await page.getByLabel('密码', { exact: true }).fill('Register456');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await expect(page.getByText('两次输入的密码不一致')).toBeVisible();
  await page.getByLabel('确认密码', { exact: true }).fill('Register456');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await expect(page.getByText('注册成功', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('framework:token'))).toBeNull();
  await page.getByRole('link', { name: '前往登录' }).click();
  await expect(page.getByLabel('账号', { exact: true })).toHaveValue('registered_user');
  await page.getByLabel('密码', { exact: true }).fill('Register456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/framework\/welcome$/);
  await expect(page.getByRole('button', { name: '用户菜单' })).toContainText('registered_user');
});

test('注册支持 32 位账号及带空格的密码，重复账号展示后端提示', async ({ page }) => {
  const username = 'a'.repeat(32);
  const password = ' password ';
  await page.route('**/api/auth/register', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ username, password });
    await route.fulfill({
      status: 400,
      json: {
        success: false,
        errCode: '10001',
        errMessage: '用户名已存在',
        data: null,
      },
    });
  });
  await page.goto('/framework/user/register');
  await page.getByLabel('账号', { exact: true }).fill(username);
  await page.getByLabel('密码', { exact: true }).fill(password);
  await page.getByLabel('确认密码', { exact: true }).fill(password);
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('用户名已存在');
  await expect(page.getByText('注册成功', { exact: true })).toHaveCount(0);
});

test('手机与横屏可直接访问和刷新注册页，并返回登录', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/framework/user/register');
  await page.reload();
  await expect(page.getByRole('heading', { name: '注册账号', exact: true })).toBeVisible();
  for (const viewport of [
    { width: 375, height: 812 },
    { width: 812, height: 375 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('button', { name: '注册', exact: true })).toBeVisible();
    const hasOverflow = await page.evaluate(() =>
      [...document.querySelectorAll('main, section')].some(
        (element) => element.scrollWidth > element.clientWidth,
      ),
    );
    expect(hasOverflow).toBe(false);
  }
  await page.getByRole('link', { name: '返回登录' }).click();
  await expect(page).toHaveURL(/\/framework\/user\/login$/);
});
