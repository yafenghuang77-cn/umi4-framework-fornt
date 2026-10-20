import { type APIRequestContext, expect, test } from '@playwright/test';

import { type SystemConfig } from '@/types/systemConfig';

test.describe.configure({ mode: 'serial' });

async function clearTestConfig(request: APIRequestContext) {
  const response = await request.get('/api/system/config');
  const { data } = (await response.json()) as { data: SystemConfig };
  const role = data.roles.find((item) => item.code === 'e2e_role');
  if (role) {
    for (const user of data.users.filter((item) => item.roleIds.includes(role.id))) {
      await request.put(`/api/system/users/${encodeURIComponent(user.id)}/roles`, {
        data: { roleIds: user.roleIds.filter((id) => id !== role.id) },
      });
    }
    await request.delete(`/api/system/roles/${encodeURIComponent(role.id)}`);
  }
  for (const code of ['e2e_page', 'e2e_directory']) {
    const menu = data.menus.find((item) => item.code === code);
    if (menu) {
      await request.delete(`/api/system/menus/${encodeURIComponent(menu.id)}`);
    }
  }
}

test.beforeEach(async ({ request }) => {
  await clearTestConfig(request);
});
test.afterEach(async ({ request }) => {
  await clearTestConfig(request);
});

test('菜单抽屉维护、角色绑定菜单和用户绑定角色', async ({ page }, testInfo) => {
  await page.goto('/framework/admin/menus');
  await expect(page.getByRole('table').first()).toBeVisible();
  await expect(page.getByRole('button', { name: '编辑系统设置', exact: true })).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.ant-pagination').evaluate((element) => {
        const content = document.querySelector('.ant-pro-layout-content')!;
        return Math.round(
          content.getBoundingClientRect().bottom -
            element.getBoundingClientRect().bottom -
            parseFloat(getComputedStyle(content).paddingBottom),
        );
      }),
    )
    .toBe(0);
  const content = page.locator('.ant-pro-layout-content');
  expect(await content.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(
    true,
  );
  const body = page.locator('.ant-table-body');
  expect(await body.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('menu-config.png'), fullPage: true });

  await page.getByRole('button', { name: '新增菜单', exact: true }).click();
  let drawer = page.getByRole('dialog');
  await drawer.getByText('目录', { exact: true }).click();
  await drawer.getByLabel('菜单名称', { exact: true }).fill('测试目录');
  await drawer.getByLabel('菜单标识', { exact: true }).fill('e2e_directory');
  await drawer.getByRole('button', { name: '保存菜单' }).click();
  await expect(drawer).not.toBeVisible();

  await page.getByRole('button', { name: '在测试目录下新增', exact: true }).click();
  drawer = page.getByRole('dialog');
  await drawer.getByLabel('菜单名称', { exact: true }).fill('测试页面');
  await drawer.getByLabel('菜单标识', { exact: true }).fill('e2e_page');
  await drawer.getByLabel('页面路径', { exact: true }).fill('/e2e-page');
  await drawer.getByRole('button', { name: '保存菜单' }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole('button', { name: '编辑测试页面', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '编辑测试页面', exact: true }).click();
  drawer = page.getByRole('dialog');
  await drawer.getByLabel('菜单名称', { exact: true }).fill('测试页面已编辑');
  await drawer.getByRole('button', { name: '保存菜单' }).click();
  await expect(drawer).not.toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: '编辑测试页面已编辑', exact: true })).toBeVisible();

  await page.getByRole('button', { name: '全部收起', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '编辑测试页面已编辑', exact: true }),
  ).not.toBeVisible();
  await page.getByRole('button', { name: '全部展开', exact: true }).click();
  await expect(page.getByRole('button', { name: '编辑测试页面已编辑', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: '搜索菜单', exact: true }).fill('测试页面已编辑');
  await expect(page.getByRole('button', { name: '编辑首页', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^(?:loading\s+)?查\s*询$/ }).click();
  await expect(page.getByRole('button', { name: '编辑测试目录', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '编辑首页', exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: /重\s*置/ }).click();
  await expect(page.getByRole('button', { name: '编辑首页', exact: true })).toBeVisible();

  await page.goto('/framework/admin/permissions');
  await page.getByRole('button', { name: '新增角色', exact: true }).click();
  drawer = page.getByRole('dialog');
  await drawer.getByLabel('角色名称', { exact: true }).fill('流程验证角色');
  await drawer.getByLabel('角色标识', { exact: true }).fill('e2e_role');
  const node = drawer.getByRole('treeitem').filter({ hasText: '测试页面已编辑' });
  await node.getByRole('checkbox').check();
  await expect(drawer.getByText('已绑定 1 个页面')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('role-menu-drawer.png'), fullPage: true });
  await drawer.getByRole('button', { name: '保存角色' }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole('button', { name: '配置流程验证角色', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('permission-config.png'), fullPage: true });

  await page.getByRole('tab', { name: /用户绑定角色/ }).click();
  await page.getByRole('button', { name: '为王五绑定角色', exact: true }).click();
  drawer = page.getByRole('dialog');
  await drawer.getByRole('combobox').click();
  await page.getByText('流程验证角色', { exact: true }).last().click();
  await expect(drawer.getByText('测试页面已编辑', { exact: true })).toBeVisible();
  await drawer.getByRole('button', { name: '保存绑定' }).click();
  await expect(drawer).not.toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: 'demo.viewer' })).toContainText(
    '流程验证角色',
  );

  await page.reload();
  await page.getByRole('tab', { name: /用户绑定角色/ }).click();
  await expect(page.getByRole('row').filter({ hasText: 'demo.viewer' })).toContainText(
    '流程验证角色',
  );
});

test('小屏下可以打开菜单抽屉并操作表单', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/framework/admin/menus');
  await page.getByRole('button', { name: '新增菜单', exact: true }).click();
  const drawer = page.getByRole('dialog');
  await expect(drawer.getByLabel('菜单名称', { exact: true })).toBeVisible();
  const save = drawer.getByRole('button', { name: '保存菜单', exact: true });
  await expect(save).toBeInViewport();
  await drawer.getByRole('button', { name: /取\s*消/ }).click();
  await expect(drawer).not.toBeVisible();
});
