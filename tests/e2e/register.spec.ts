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
  await page.goto('/framework/user/register');
  await page.getByLabel('账号', { exact: true }).fill('ab');
  await page.getByLabel('密码', { exact: true }).fill('123');
  await page.getByLabel('确认密码', { exact: true }).fill('other-password');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await expect(page.getByText('账号需为 4–20 位字母、数字或下划线')).toBeVisible();
  await expect(page.getByText('密码长度需为 8–64 位')).toBeVisible();
  await expect(page.getByText('两次输入的密码不一致')).toBeVisible();

  await page.getByLabel('账号', { exact: true }).fill('registered_user');
  await page.getByLabel('密码', { exact: true }).fill('Register123');
  await page.getByLabel('确认密码', { exact: true }).fill('Register123');
  // 修改原密码后，确认密码必须重新校验。
  await page.getByLabel('密码', { exact: true }).fill('Register456');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await expect(page.getByText('两次输入的密码不一致')).toBeVisible();
  await page.getByLabel('确认密码', { exact: true }).fill('Register456');
  await page.getByRole('button', { name: '注册', exact: true }).click();
  await expect(page.getByText('注册成功', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: '前往登录' }).click();
  await expect(page.getByLabel('账号', { exact: true })).toHaveValue('registered_user');
  await page.getByLabel('密码', { exact: true }).fill('Register456');
  await page.getByRole('button', { name: '登录', exact: true }).click();
  await expect(page).toHaveURL(/\/framework\/welcome$/);
  await expect(page.getByRole('button', { name: '用户菜单' })).toContainText('registered_user');
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
