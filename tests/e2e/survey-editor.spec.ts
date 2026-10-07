import { expect, test } from '@playwright/test';

test('问卷页面保留树形题型和拖拽数据，画布与设置面板为空白', async ({ page }) => {
  await page.goto('/framework/survey/editor');
  const palette = page.getByRole('complementary', { name: '题型面板' });
  const canvas = page.getByRole('main', { name: '问卷画布' });
  const settings = page.getByRole('complementary', { name: '设置面板' });
  await expect(canvas.getByText('先创建容器，再拖拽题目到容器内')).toBeVisible();
  await expect(settings).toHaveText('');
  await expect(settings.locator('input, button, textarea')).toHaveCount(0);
  for (const category of ['选择题', '填空题', '打分题', '矩阵题', '其他']) {
    const parent = palette.getByRole('button', { name: `${category}分类`, exact: true });
    await parent.click();
    await expect(parent).toHaveAttribute('aria-expanded', 'true');
  }
  await expect(palette.locator('button[draggable="true"]')).toHaveCount(24);
  const payload = await palette
    .getByRole('button', { name: '单选题', exact: true })
    .evaluate((element) => {
      const dataTransfer = new DataTransfer();
      element.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
      return dataTransfer.getData('application/x-survey-item');
    });
  expect(JSON.parse(payload)).toEqual({ type: 'question', kind: 'single' });
  await page.getByLabel('问卷名称').fill('页面切换测试');
  await page.getByRole('button', { name: '逻辑', exact: true }).click();
  await expect(page.getByRole('main', { name: '逻辑编辑页' })).toBeVisible();
  await expect(page.getByRole('main', { name: '逻辑编辑页' })).toBeEmpty();
  await expect(palette).toHaveCount(0);
  await expect(canvas).toHaveCount(0);
  await expect(settings).toHaveCount(0);
  await page.getByRole('button', { name: '样式', exact: true }).click();
  await expect(page.getByRole('main', { name: '样式编辑页' })).toBeVisible();
  await expect(page.getByRole('main', { name: '逻辑编辑页' })).toHaveCount(0);
  await page.getByRole('button', { name: '内容', exact: true }).click();
  await expect(page.getByRole('region', { name: '内容编辑页' })).toBeVisible();
  await expect(palette).toBeVisible();
  await expect(canvas.getByText('先创建容器，再拖拽题目到容器内')).toBeVisible();
  await expect(settings).toHaveText('');
  await expect(page.getByLabel('问卷名称')).toHaveValue('页面切换测试');
  await expect(page.getByRole('button', { name: '保存并返回' })).toBeDisabled();
});

test('题库支持搜索、标签筛选和分页，保留空白画布', async ({ page }) => {
  await page.goto('/framework/survey/editor');
  await page.getByRole('tab', { name: /题库/ }).click();
  const bank = page.getByRole('region', { name: '题库', exact: true });
  const results = bank.getByRole('list', { name: '题库题目' });
  await expect(results.getByRole('listitem')).toHaveCount(8);
  await bank.getByTitle('2', { exact: true }).click();
  await expect(results.getByRole('listitem').first()).toHaveAttribute(
    'aria-label',
    '你觉得xxx颜色如何',
  );
  await page.getByLabel('搜索题库').fill('aitest');
  await expect(results.getByRole('listitem')).toHaveCount(1);
  await expect(results.getByRole('listitem')).toHaveAttribute('aria-label', 'aitest');
  await page.getByLabel('搜索题库').fill('不存在的题目');
  await expect(bank.getByText('暂无匹配题目')).toBeVisible();
  await page.getByLabel('搜索题库').fill('');
  await bank.getByText('标签名字测试', { exact: true }).first().click();
  await expect(results.getByRole('listitem')).toHaveCount(1);
  await expect(results.getByRole('listitem')).toHaveAttribute('aria-label', '测试');
  await bank.getByRole('button', { name: '展开全部' }).click();
  await expect(bank.getByRole('button', { name: '收起', exact: true })).toBeVisible();
  const payload = await results.getByRole('listitem').evaluate((element) => {
    const dataTransfer = new DataTransfer();
    element.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer }));
    return dataTransfer.getData('application/x-survey-item');
  });
  expect(JSON.parse(payload)).toMatchObject({
    type: 'bankQuestion',
    question: { title: '测试', type: 'FillInBlanks' },
  });
  await expect(page.getByRole('main', { name: '问卷画布' }).getByRole('group')).toHaveCount(0);
});

test('仅拖拽添加容器，支持拖拽排序和引导语设置联动', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto('/framework/survey/editor');
  const palette = page.getByRole('complementary', { name: '题型面板' });
  const canvas = page.getByRole('main', { name: '问卷画布' });
  await palette.getByRole('button', { name: '题目组', exact: true }).click();
  await expect(canvas.getByRole('group')).toHaveCount(0);
  await palette.getByRole('button', { name: '题目组', exact: true }).dragTo(canvas);
  const settings = page.getByRole('complementary', { name: '设置面板' });
  await expect(page.getByLabel('题目组名称')).toHaveValue('新建题目组');
  await page.getByLabel('题目组名称').fill('基础问题');
  await expect(canvas.getByRole('group', { name: '基础问题', exact: true })).toBeVisible();
  await settings.getByRole('tab', { name: '逻辑设置', exact: true }).click();
  await expect(settings.getByRole('region', { name: '容器逻辑设置' })).toBeEmpty();
  await settings.getByRole('tab', { name: '题目设置', exact: true }).click();
  await page.getByLabel('题目组名称').fill('新建题目组');

  await palette
    .getByRole('button', { name: '追问区', exact: true })
    .dragTo(canvas.getByText('拖拽容器组件到此处'));
  await expect(page.getByLabel('追问区名称')).toHaveValue('追问区');
  await page.getByLabel('追问区名称').fill('补充追问');
  await expect(canvas.getByRole('group', { name: '补充追问', exact: true })).toBeVisible();
  await page.getByLabel('追问区名称').fill('追问区');
  await palette
    .getByRole('button', { name: '引导语', exact: true })
    .dragTo(canvas.getByText('拖拽容器组件到此处'));
  await expect(canvas.getByRole('group')).toHaveCount(3);
  await expect(page.getByLabel('引导语名称')).toHaveValue('引导语标题');
  await expect(page.getByLabel('引导语文案')).toHaveCount(0);
  await page.getByLabel('引导语名称').fill('访谈说明');
  await expect(canvas.getByRole('group', { name: '访谈说明', exact: true })).toBeVisible();
  await canvas.getByRole('button', { name: '编辑引导语', exact: true }).click();
  await expect(page.getByLabel('引导语名称')).toHaveCount(0);
  await expect(page.getByLabel('引导语文案')).toHaveValue(
    '感谢您参与本次访谈，请根据实际情况作答。',
  );
  await page.getByLabel('引导语文案').fill('欢迎参加本次访谈。');
  await page.getByLabel('展示时间(秒)').fill('8');
  await page.getByLabel('展示时间(秒)').blur();
  await expect(canvas.getByText('欢迎参加本次访谈。')).toBeVisible();
  await expect(canvas.getByText('引导语 · 展示8秒')).toBeVisible();
  await canvas
    .getByRole('button', { name: '拖动访谈说明', exact: true })
    .dragTo(canvas.getByRole('group', { name: '新建题目组', exact: true }), {
      targetPosition: { x: 30, y: 10 },
    });
  await expect(canvas.getByRole('group').first()).toHaveAttribute('aria-label', '访谈说明');
  await canvas
    .getByRole('button', { name: '拖动访谈说明', exact: true })
    .dragTo(canvas.getByText('拖拽容器组件到此处'));
  await expect(canvas.getByRole('group').last()).toHaveAttribute('aria-label', '访谈说明');
  await page.getByRole('button', { name: '逻辑', exact: true }).click();
  await page.getByRole('button', { name: '内容', exact: true }).click();
  await expect(canvas.getByRole('group')).toHaveCount(3);
  await expect(page.getByLabel('引导语文案')).toHaveValue('欢迎参加本次访谈。');
  await canvas.getByRole('button', { name: '设置访谈说明', exact: true }).click();
  await expect(page.getByLabel('引导语名称')).toHaveValue('访谈说明');
  await expect(page.getByLabel('引导语文案')).toHaveCount(0);
  await expect(page.getByLabel('展示时间(秒)')).toHaveCount(0);
  await canvas.getByRole('button', { name: '删除访谈说明', exact: true }).click();
  await expect(canvas.getByRole('group')).toHaveCount(2);
  await expect(page.getByLabel('引导语文案')).toHaveCount(0);
});
