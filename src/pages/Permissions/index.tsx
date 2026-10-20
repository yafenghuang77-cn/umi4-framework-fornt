import { type Key, useEffect, useState } from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Tree,
  type TreeDataNode,
  Typography,
} from 'antd';

import {
  type MenuNode,
  type SystemConfig,
  type SystemRole,
  type SystemUser,
} from '@/types/systemConfig';
import { buildMenuTree, effectiveMenuIds } from '@/utils/menu';

import styles from '../SystemSettings/index.less';
import useTableLayout from '../SystemSettings/useTableLayout';

interface PermissionFilters {
  name?: string;
  code?: string;
  username?: string;
  enabled?: 'enabled' | 'disabled';
  roleId?: string;
}

function authorizationTree(nodes: MenuNode[]): TreeDataNode[] {
  return nodes.map((menu) => ({
    key: menu.id,
    title: (
      <Space>
        {menu.name}
        {!menu.enabled && <Tag>停用</Tag>}
        {!menu.visible && <Tag>隐藏</Tag>}
      </Space>
    ),
    ...(menu.children?.length ? { children: authorizationTree(menu.children) } : {}),
    disableCheckbox: menu.type === 'directory' && !menu.children?.length,
  }));
}

function previewTree(nodes: MenuNode[], ids: string[]): TreeDataNode[] {
  return nodes.flatMap((menu) => {
    const children = previewTree(menu.children || [], ids);
    return children.length || ids.includes(menu.id)
      ? [{ key: menu.id, title: menu.name, ...(children.length ? { children } : {}) }]
      : [];
  });
}

export default function Permissions() {
  const { menus, roles, users, error, loading, saving, refresh, saveRole, deleteRole, bindRoles } =
    useModel('systemConfig');
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const { message } = App.useApp();
  const [tab, setTab] = useState('roles');
  const [filters, setFilters] = useState<PermissionFilters>({});
  const { viewportRef, viewportStyle, scrollY } = useTableLayout();
  const [roleOpen, setRoleOpen] = useState(false);
  const [editing, setEditing] = useState<SystemRole>();
  const [bindingUser, setBindingUser] = useState<SystemUser>();
  const [roleForm] = Form.useForm<SystemRole>();
  const [userForm] = Form.useForm<{ roleIds: string[] }>();
  const selectedMenus: string[] = Form.useWatch('menuIds', roleForm) || [];
  const selectedRoles: string[] = Form.useWatch('roleIds', userForm) || [];
  const tree = buildMenuTree(menus);
  const data: SystemConfig = { version: 1, menus, roles, users };
  const effectiveIds = effectiveMenuIds(data, selectedRoles);
  const preview = previewTree(tree, effectiveIds);
  const searching = Object.values(filters).some(Boolean);
  const matchesText = (value: string, search?: string) =>
    value.toLowerCase().includes(search?.trim().toLowerCase() || '');

  function editRole(role?: SystemRole) {
    setEditing(role);
    roleForm.resetFields();
    roleForm.setFieldsValue(
      role || { name: '', code: '', description: '', enabled: true, menuIds: [] },
    );
    setRoleOpen(true);
  }

  async function submitRole(values: SystemRole) {
    try {
      await saveRole({
        ...values,
        id: editing?.id || crypto.randomUUID(),
        name: values.name.trim(),
        code: values.code.trim(),
        description: values.description?.trim() || '',
        menuIds: values.menuIds || [],
      });
      setRoleOpen(false);
      message.success(editing ? '角色及菜单绑定已更新' : '角色已新增');
    } catch (issue) {
      message.error((issue as Error).message);
    }
  }

  const roleColumns: Array<ProColumns<SystemRole>> = [
    { title: '角色名称', dataIndex: 'name', width: 170 },
    { title: '角色标识', dataIndex: 'code', width: 180, copyable: true },
    {
      title: '角色说明',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
      render: (_, role) => role.description || '—',
    },
    {
      title: '绑定页面',
      search: false,
      width: 100,
      render: (_, role) => <Tag color="blue">{role.menuIds.length} 个</Tag>,
    },
    {
      title: '关联用户',
      search: false,
      width: 100,
      render: (_, role) => `${users.filter((user) => user.roleIds.includes(role.id)).length} 人`,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueType: 'select',
      valueEnum: { enabled: '启用', disabled: '停用' },
      width: 85,
      render: (_, role) => (
        <Tag color={role.enabled ? 'success' : 'default'}>{role.enabled ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, role) => [
        <Button
          key="edit"
          type="link"
          size="small"
          aria-label={`配置${role.name}`}
          onClick={() => editRole(role)}
        >
          配置
        </Button>,
        <Popconfirm
          key="delete"
          title={`删除“${role.name}”？`}
          description="已绑定用户的角色需要先解除关联。"
          okText="删除"
          cancelText="取消"
          onConfirm={async () => {
            try {
              await deleteRole(role.id);
              message.success('角色已删除');
            } catch (issue) {
              message.error((issue as Error).message);
            }
          }}
        >
          <Button type="link" danger size="small" aria-label={`删除${role.name}`}>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const userColumns: Array<ProColumns<SystemUser>> = [
    { title: '用户姓名', dataIndex: 'name', width: 180 },
    { title: '登录账号', dataIndex: 'username', width: 180 },
    {
      title: '已绑定角色',
      dataIndex: 'roleId',
      valueType: 'select',
      fieldProps: { options: roles.map((role) => ({ label: role.name, value: role.id })) },
      render: (_, user) => {
        const assigned = roles.filter((role) => user.roleIds.includes(role.id));
        return assigned.length ? (
          <Space wrap>
            {assigned.map((role) => (
              <Tag key={role.id} color={role.enabled ? 'blue' : 'default'}>
                {role.name}
                {!role.enabled && '（停用）'}
              </Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">未绑定角色</Typography.Text>
        );
      },
    },
    {
      title: '有效页面',
      search: false,
      width: 110,
      render: (_, user) => `${effectiveMenuIds(data, user.roleIds).length} 个`,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, user) => [
        <Button
          key="bind"
          type="link"
          size="small"
          aria-label={`为${user.name}绑定角色`}
          onClick={() => {
            setBindingUser(user);
            userForm.setFieldsValue({ roleIds: [...user.roleIds] });
          }}
        >
          绑定角色
        </Button>,
      ],
    },
  ];

  return (
    <div ref={viewportRef} className={styles.viewport} style={viewportStyle}>
      <PageContainer pageHeaderRender={false} className={styles.container}>
        <div className={styles.page}>
          {error && (
            <Alert
              type="error"
              showIcon
              title={error}
              action={<Button onClick={() => void refresh()}>重试</Button>}
            />
          )}
          <Tabs
            className={styles.tabs}
            activeKey={tab}
            onChange={(key) => {
              setTab(key);
              setFilters({});
            }}
            items={[
              { key: 'roles', label: `角色绑定菜单（${roles.length}）` },
              { key: 'users', label: `用户绑定角色（${users.length}）` },
            ]}
          />
          {tab === 'roles' ? (
            <ProTable<SystemRole, PermissionFilters>
              key="roles"
              className={styles.list}
              loading={loading}
              rowKey="id"
              headerTitle="角色列表"
              columns={roleColumns}
              dataSource={roles.filter(
                (role) =>
                  matchesText(role.name, filters.name) &&
                  matchesText(role.code, filters.code) &&
                  (!filters.enabled || role.enabled === (filters.enabled === 'enabled')),
              )}
              search={{ labelWidth: 'auto', defaultCollapsed: false, collapseRender: false }}
              onSubmit={setFilters}
              onReset={() => setFilters({})}
              options={{ reload: false, density: true, setting: true, fullScreen: true }}
              toolBarRender={() => [
                <Button
                  key="create"
                  type="primary"
                  disabled={loading || Boolean(error)}
                  icon={<PlusOutlined aria-hidden="true" />}
                  onClick={() => editRole()}
                >
                  新增角色
                </Button>,
              ]}
              pagination={{ defaultPageSize: 10, showSizeChanger: true }}
              scroll={{ x: 1000, y: scrollY }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={searching ? '没有匹配的角色' : '暂无角色，点击“新增角色”添加'}
                  />
                ),
              }}
            />
          ) : (
            <ProTable<SystemUser, PermissionFilters>
              key="users"
              className={styles.list}
              loading={loading}
              rowKey="id"
              headerTitle="用户列表"
              columns={userColumns}
              dataSource={users.filter(
                (user) =>
                  matchesText(user.name, filters.name) &&
                  matchesText(user.username, filters.username) &&
                  (!filters.roleId || user.roleIds.includes(filters.roleId)),
              )}
              search={{ labelWidth: 'auto', defaultCollapsed: false, collapseRender: false }}
              onSubmit={setFilters}
              onReset={() => setFilters({})}
              options={{ reload: false, density: true, setting: true, fullScreen: true }}
              pagination={{ defaultPageSize: 10, showSizeChanger: true }}
              scroll={{ x: 900, y: scrollY }}
              locale={{
                emptyText: (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的用户" />
                ),
              }}
            />
          )}
        </div>
        <Drawer
          title={editing ? '编辑角色与菜单权限' : '新增角色'}
          open={roleOpen}
          onClose={() => setRoleOpen(false)}
          size="min(600px, 100vw)"
          footer={
            <div className={styles.drawerFooter}>
              <Button onClick={() => setRoleOpen(false)}>取消</Button>
              <Button type="primary" loading={saving} onClick={() => roleForm.submit()}>
                保存角色
              </Button>
            </div>
          }
        >
          <Form form={roleForm} layout="vertical" onFinish={submitRole} validateTrigger="onBlur">
            <div className={styles.formGrid}>
              <Form.Item
                name="name"
                label="角色名称"
                rules={[{ required: true, whitespace: true, message: '请输入角色名称' }]}
              >
                <Input maxLength={30} placeholder="例如：业务管理员" />
              </Form.Item>
              <Form.Item
                name="code"
                label="角色标识"
                rules={[
                  { required: true, message: '请输入角色标识' },
                  {
                    pattern: /^[a-zA-Z][a-zA-Z0-9:_-]*$/,
                    message: '字母开头，可包含数字、冒号、下划线和短横线',
                  },
                  {
                    validator: (_, value) =>
                      roles.some((role) => role.id !== editing?.id && role.code === value)
                        ? Promise.reject(new Error('角色标识已存在'))
                        : Promise.resolve(),
                  },
                ]}
              >
                <Input maxLength={80} placeholder="例如：business_admin" />
              </Form.Item>
            </div>
            <Form.Item name="description" label="角色说明">
              <Input.TextArea
                maxLength={200}
                showCount
                rows={3}
                placeholder="说明该角色的职责与适用人员"
              />
            </Form.Item>
            <Form.Item
              name="enabled"
              label="角色状态"
              valuePropName="checked"
              extra="停用后，绑定关系保留，该角色不计入用户的有效菜单。"
            >
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
            <Typography.Title level={5}>绑定菜单</Typography.Title>
            <Space wrap>
              <Button
                size="small"
                onClick={() =>
                  roleForm.setFieldValue(
                    'menuIds',
                    menus.filter((menu) => menu.type === 'page').map((menu) => menu.id),
                  )
                }
              >
                全选页面
              </Button>
              <Button size="small" onClick={() => roleForm.setFieldValue('menuIds', [])}>
                清空选择
              </Button>
              <Typography.Text type="secondary">
                已绑定 {selectedMenus.length} 个页面
              </Typography.Text>
            </Space>
            <div className={styles.treePanel}>
              <Form.Item
                name="menuIds"
                valuePropName="checkedKeys"
                getValueFromEvent={(keys: Key[]) =>
                  keys.filter((key) =>
                    menus.some((menu) => menu.id === key && menu.type === 'page'),
                  )
                }
                trigger="onCheck"
                noStyle
              >
                <Tree
                  key={roleOpen ? editing?.id || 'new-role' : 'closed'}
                  checkable
                  defaultExpandAll
                  treeData={authorizationTree(tree)}
                  aria-label="角色菜单权限"
                />
              </Form.Item>
              {!menus.length && (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="暂无菜单，请先前往菜单配置添加"
                />
              )}
            </div>
          </Form>
        </Drawer>
        <Drawer
          title="绑定用户角色"
          open={Boolean(bindingUser)}
          onClose={() => setBindingUser(undefined)}
          size="min(560px, 100vw)"
          footer={
            <div className={styles.drawerFooter}>
              <Button onClick={() => setBindingUser(undefined)}>取消</Button>
              <Button type="primary" loading={saving} onClick={() => userForm.submit()}>
                保存绑定
              </Button>
            </div>
          }
        >
          <Typography.Paragraph>
            <Typography.Text strong>{bindingUser?.name}</Typography.Text> · {bindingUser?.username}
          </Typography.Paragraph>
          <Form
            form={userForm}
            layout="vertical"
            onFinish={async ({ roleIds }) => {
              if (!bindingUser) {
                return;
              }
              try {
                await bindRoles(bindingUser.id, roleIds || []);
                setBindingUser(undefined);
                message.success('用户角色绑定已更新');
              } catch (issue) {
                message.error((issue as Error).message);
              }
            }}
          >
            <Form.Item
              name="roleIds"
              label="绑定角色"
              extra="可选择多个角色；清空后该用户没有有效菜单。"
            >
              <Select
                mode="multiple"
                allowClear
                optionFilterProp="label"
                placeholder="请选择角色"
                options={roles.map((role) => ({
                  value: role.id,
                  label: `${role.name}${role.enabled ? '' : '（停用）'}`,
                }))}
              />
            </Form.Item>
            <Typography.Title level={5}>
              有效菜单预览 <Tag color="blue">{effectiveIds.length} 个页面</Tag>
            </Typography.Title>
            <div className={styles.treePanel}>
              {preview.length ? (
                <Tree
                  key={effectiveIds.join(',')}
                  defaultExpandAll
                  treeData={preview}
                  selectable={false}
                  aria-label="用户有效菜单"
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无有效菜单" />
              )}
            </div>
          </Form>
        </Drawer>
      </PageContainer>
    </div>
  );
}
