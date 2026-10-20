import { type SystemConfig, type SystemMenu } from '@/types/systemConfig';
import { buildMenuTree, effectiveMenuIds } from '@/utils/menu';

import { validateConfig, validateMenu } from '../../mock/systemConfig';

function menu(id: string, parentId: string | null = null, directory = false): SystemMenu {
  return {
    id,
    parentId,
    name: id,
    code: id,
    type: directory ? 'directory' : 'page',
    path: directory ? '' : `/${id}`,
    icon: '',
    sort: 10,
    enabled: true,
    visible: true,
  };
}

function config(): SystemConfig {
  return {
    version: 1,
    menus: [
      menu('root', null, true),
      menu('nested', 'root', true),
      menu('one', 'nested'),
      menu('two'),
    ],
    roles: [
      { id: 'a', name: '角色 A', code: 'role_a', description: '', enabled: true, menuIds: ['one'] },
      {
        id: 'b',
        name: '角色 B',
        code: 'role_b',
        description: '',
        enabled: true,
        menuIds: ['one', 'two'],
      },
    ],
    users: [{ id: 'user', name: '测试用户', username: 'test', roleIds: ['a', 'b'] }],
  };
}

test('树形结构按同级排序，构建过程不改变源数据', () => {
  const menus = [menu('late'), { ...menu('early'), sort: 1 }, menu('child', 'early')];
  const tree = buildMenuTree(menus);
  expect(tree.map((item) => item.id)).toEqual(['early', 'late']);
  expect(tree[0].children?.map((item) => item.id)).toEqual(['child']);
  expect(menus.map((item) => item.id)).toEqual(['late', 'early', 'child']);
});

test('移动目录时阻止自身或后代成为父节点', () => {
  const { menus } = config();
  expect(validateMenu({ ...menus[0], parentId: 'root' }, menus)).toContain('自身');
  expect(validateMenu({ ...menus[0], parentId: 'nested' }, menus)).toContain('下级目录');
  expect(validateMenu({ ...menus[0], parentId: 'missing' }, menus)).toContain('有效目录');
});

test('拒绝重复标识、重复路径和包含子节点的目录转页面', () => {
  const { menus } = config();
  expect(validateMenu({ ...menu('new'), code: 'one' }, menus)).toContain('标识已存在');
  expect(validateMenu({ ...menu('new'), path: '/one' }, menus)).toContain('绑定其他菜单');
  expect(validateMenu({ ...menus[0], type: 'page', path: '/new' }, menus)).toContain('包含下级');
});

test('用户多角色权限取并集，停用角色不参与计算', () => {
  const data = config();
  expect(effectiveMenuIds(data, ['a', 'b'])).toEqual(['one', 'two']);
  data.roles[1].enabled = false;
  expect(effectiveMenuIds(data, ['a', 'b'])).toEqual(['one']);
  expect(effectiveMenuIds(data, [])).toEqual([]);
});

test('停用祖先目录阻断后代页面；隐藏页面保留授权', () => {
  const data = config();
  data.menus[0].enabled = false;
  data.menus[3].visible = false;
  expect(effectiveMenuIds(data, ['a', 'b'])).toEqual(['two']);
  data.menus[0].enabled = true;
  data.menus[2].enabled = false;
  expect(effectiveMenuIds(data, ['a', 'b'])).toEqual(['two']);
});

test('拒绝悬空授权关系与循环目录，避免树形渲染异常', () => {
  const data = config();
  data.roles[0].menuIds.push('deleted-menu');
  expect(() => validateConfig(data)).toThrow('无效的菜单或角色关联');
  data.roles[0].menuIds.pop();
  data.menus[0].parentId = 'nested';
  expect(() => validateConfig(data)).toThrow('自身或其下级目录');
});
