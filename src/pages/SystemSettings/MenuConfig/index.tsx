import { type Key, useEffect, useState } from 'react';

import {
  DashboardOutlined,
  FileOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  HomeOutlined,
  MenuOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  Alert,
  App,
  AutoComplete,
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  TreeSelect,
  Typography,
} from 'antd';

import { type MenuNode, type SystemMenu } from '@/types/systemConfig';
import { buildMenuTree, descendantIds } from '@/utils/menu';

import styles from '../index.less';
import useTableLayout from '../useTableLayout';
import { availablePages } from './pageOptions';

interface MenuFilters {
  name?: string;
  code?: string;
  enabled?: 'enabled' | 'disabled';
}

const menuIcons: Record<string, { name: string; Icon: typeof HomeOutlined }> = {
  HomeOutlined: { name: '首页', Icon: HomeOutlined },
  SettingOutlined: { name: '设置', Icon: SettingOutlined },
  MenuOutlined: { name: '菜单', Icon: MenuOutlined },
  SafetyCertificateOutlined: { name: '权限', Icon: SafetyCertificateOutlined },
  TeamOutlined: { name: '团队', Icon: TeamOutlined },
  UserOutlined: { name: '用户', Icon: UserOutlined },
  FolderOpenOutlined: { name: '文件夹', Icon: FolderOpenOutlined },
  DashboardOutlined: { name: '仪表盘', Icon: DashboardOutlined },
};

const iconOptions = Object.entries(menuIcons).map(([value, { name, Icon }]) => ({
  value,
  label: <Icon aria-label={name} />,
}));

function filterTree(nodes: MenuNode[], filters: MenuFilters, parentMatches = false): MenuNode[] {
  return nodes.flatMap((node) => {
    const nameMatches =
      parentMatches ||
      (node.name.toLowerCase().includes(filters.name?.trim().toLowerCase() || '') &&
        node.code.toLowerCase().includes(filters.code?.trim().toLowerCase() || ''));
    const matches =
      nameMatches && (!filters.enabled || node.enabled === (filters.enabled === 'enabled'));
    const children = filterTree(node.children || [], filters, nameMatches);
    if (!matches && !children.length) {
      return [];
    }
    const { children: _children, ...item } = node;
    return [
      {
        ...item,
        ...(children.length ? { children } : {}),
      },
    ];
  });
}

interface ParentOption {
  value: string;
  title: string;
  children?: ParentOption[];
}

function parentOptions(nodes: MenuNode[]): ParentOption[] {
  return nodes
    .filter((node) => node.type === 'directory')
    .map((node) => ({
      value: node.id,
      title: node.name,
      children: parentOptions(node.children || []),
    }));
}

export default function MenuConfig() {
  const { menus, error, loading, saving, refresh, saveMenu, deleteMenu } = useModel('systemConfig');
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const { message } = App.useApp();
  const [filters, setFilters] = useState<MenuFilters>({});
  const { viewportRef, viewportStyle, scrollY } = useTableLayout();
  const [expanded, setExpanded] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SystemMenu>();
  const [form] = Form.useForm<SystemMenu>();
  const type = Form.useWatch('type', form);
  const tree = buildMenuTree(menus);
  const searching = Object.values(filters).some(Boolean);
  const filtered = filterTree(tree, filters);
  const excludedIds = editing ? descendantIds(menus, editing.id) : [];

  function openEditor(menu?: SystemMenu, parentId: string | null = null) {
    setEditing(menu);
    form.resetFields();
    form.setFieldsValue(
      menu || {
        parentId,
        type: 'page',
        name: '',
        code: '',
        path: '',
        icon: '',
        sort:
          Math.max(
            0,
            ...menus.filter((item) => item.parentId === parentId).map((item) => item.sort),
          ) + 10,
        enabled: true,
        visible: true,
      },
    );
    setOpen(true);
  }

  async function submit(values: SystemMenu) {
    try {
      const menu = {
        ...values,
        id: editing?.id || crypto.randomUUID(),
        parentId: values.parentId || null,
        path: values.type === 'directory' ? '' : values.path,
        icon: values.icon || '',
        name: values.name.trim(),
        code: values.code.trim(),
      };
      await saveMenu(menu);
      setExpanded((ids) => [...new Set([...ids, ...(menu.parentId ? [menu.parentId] : [])])]);
      setOpen(false);
      message.success(editing ? '菜单已更新' : '菜单已新增');
    } catch (issue) {
      message.error((issue as Error).message);
    }
  }

  const columns: Array<ProColumns<MenuNode>> = [
    {
      title: '菜单名称',
      dataIndex: 'name',
      fieldProps: { placeholder: '请输入', 'aria-label': '搜索菜单' },
      width: 240,
      render: (_, menu) => {
        const Icon =
          menuIcons[menu.icon]?.Icon || (menu.type === 'directory' ? FolderOutlined : FileOutlined);
        return (
          <Space>
            <Icon aria-hidden="true" />
            {menu.name}
          </Space>
        );
      },
    },
    {
      title: '菜单标识',
      dataIndex: 'code',
      width: 200,
      copyable: true,
      fieldProps: { placeholder: '请输入' },
    },
    {
      title: '类型',
      dataIndex: 'type',
      search: false,
      width: 80,
      render: (_, menu) => (
        <Tag color={menu.type === 'directory' ? 'blue' : 'default'}>
          {menu.type === 'directory' ? '目录' : '页面'}
        </Tag>
      ),
    },
    {
      title: '页面路径',
      dataIndex: 'path',
      search: false,
      width: 230,
      render: (_, menu) => menu.path || '—',
    },
    { title: '排序', dataIndex: 'sort', search: false, width: 70 },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueType: 'select',
      valueEnum: { enabled: '启用', disabled: '停用' },
      width: 85,
      render: (_, menu) => (
        <Tag color={menu.enabled ? 'success' : 'default'}>{menu.enabled ? '启用' : '停用'}</Tag>
      ),
    },
    {
      title: '菜单栏',
      dataIndex: 'visible',
      search: false,
      width: 85,
      render: (_, menu) => (menu.visible ? '显示' : '隐藏'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_, menu) => [
        <Button
          key="edit"
          type="link"
          size="small"
          aria-label={`编辑${menu.name}`}
          onClick={() => openEditor(menu)}
        >
          编辑
        </Button>,
        menu.type === 'directory' ? (
          <Button
            key="child"
            type="link"
            size="small"
            aria-label={`在${menu.name}下新增`}
            onClick={() => openEditor(undefined, menu.id)}
          >
            新增下级
          </Button>
        ) : null,
        <Popconfirm
          key="delete"
          title={`删除“${menu.name}”？`}
          description="存在下级菜单或角色绑定时，需要先解除关联。"
          okText="删除"
          cancelText="取消"
          onConfirm={async () => {
            try {
              await deleteMenu(menu.id);
              message.success('菜单已删除');
            } catch (issue) {
              message.error((issue as Error).message);
            }
          }}
        >
          <Button type="link" danger size="small" aria-label={`删除${menu.name}`}>
            删除
          </Button>
        </Popconfirm>,
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
          <ProTable<MenuNode, MenuFilters>
            className={styles.list}
            loading={loading}
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            search={{ labelWidth: 'auto', defaultCollapsed: false, collapseRender: false }}
            onSubmit={setFilters}
            onReset={() => setFilters({})}
            pagination={{ defaultPageSize: 10, showSizeChanger: true }}
            headerTitle={
              <Space>
                菜单列表<Typography.Text type="secondary">共 {menus.length} 项</Typography.Text>
              </Space>
            }
            options={{ reload: false, density: true, setting: true, fullScreen: true }}
            scroll={{ x: 1220, y: scrollY }}
            toolBarRender={() => [
              <Button
                key="create"
                type="primary"
                icon={<PlusOutlined aria-hidden="true" />}
                disabled={loading || Boolean(error)}
                onClick={() => openEditor()}
              >
                新增菜单
              </Button>,
            ]}
            expandable={{
              expandedRowKeys: searching ? menus.map((menu) => menu.id) : expanded,
              onExpandedRowsChange: (keys) => setExpanded([...keys]),
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={menus.length ? '没有匹配的菜单' : '暂无菜单，点击“新增菜单”添加'}
                />
              ),
            }}
          />
        </div>
        <Drawer
          title={editing ? '编辑菜单' : '新增菜单'}
          open={open}
          size="min(560px, 100vw)"
          onClose={() => setOpen(false)}
          footer={
            <div className={styles.drawerFooter}>
              <Button onClick={() => setOpen(false)}>取消</Button>
              <Button type="primary" loading={saving} onClick={() => form.submit()}>
                保存菜单
              </Button>
            </div>
          }
        >
          <Form form={form} layout="vertical" onFinish={submit} validateTrigger="onBlur">
            <Form.Item name="type" label="菜单类型" rules={[{ required: true }]}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                options={[
                  { value: 'directory', label: '目录' },
                  { value: 'page', label: '页面' },
                ]}
              />
            </Form.Item>
            <Form.Item name="parentId" label="上级目录">
              <TreeSelect
                allowClear
                treeDefaultExpandAll
                placeholder="顶级菜单"
                treeData={parentOptions(
                  buildMenuTree(menus.filter((menu) => !excludedIds.includes(menu.id))),
                )}
              />
            </Form.Item>
            <div className={styles.formGrid}>
              <Form.Item
                name="name"
                label="菜单名称"
                rules={[{ required: true, whitespace: true, message: '请输入菜单名称' }]}
              >
                <Input maxLength={30} placeholder="例如：菜单配置" />
              </Form.Item>
              <Form.Item
                name="code"
                label="菜单标识"
                rules={[
                  { required: true, message: '请输入菜单标识' },
                  {
                    pattern: /^[a-zA-Z][a-zA-Z0-9:_-]*$/,
                    message: '字母开头，可包含数字、冒号、下划线和短横线',
                  },
                  {
                    validator: (_, value) =>
                      menus.some((menu) => menu.id !== editing?.id && menu.code === value)
                        ? Promise.reject(new Error('菜单标识已存在'))
                        : Promise.resolve(),
                  },
                ]}
              >
                <Input maxLength={80} placeholder="例如：system:menus" />
              </Form.Item>
            </div>
            {type === 'page' && (
              <Form.Item
                name="path"
                label="页面路径"
                rules={[
                  { required: true, message: '请输入页面路径' },
                  {
                    pattern: /^\/(?!\/)[a-zA-Z0-9/_:.-]+$/,
                    message: '请输入以 / 开头的有效页面路径',
                  },
                  {
                    validator: (_, value) =>
                      menus.some(
                        (menu) =>
                          menu.id !== editing?.id && menu.type === 'page' && menu.path === value,
                      )
                        ? Promise.reject(new Error('该页面路径已绑定其他菜单'))
                        : Promise.resolve(),
                  },
                ]}
              >
                <AutoComplete
                  placeholder="例如：/users/accounts"
                  filterOption={(input, option) =>
                    String(option?.label).toLowerCase().includes(input.toLowerCase())
                  }
                  options={availablePages.map((page) => ({
                    ...page,
                    disabled: menus.some(
                      (menu) =>
                        menu.id !== editing?.id && menu.type === 'page' && menu.path === page.value,
                    ),
                  }))}
                />
              </Form.Item>
            )}
            <div className={styles.formGrid}>
              <Form.Item name="icon" label="菜单图标">
                <Select allowClear virtual={false} placeholder="不设置图标" options={iconOptions} />
              </Form.Item>
              <Form.Item
                name="sort"
                label="显示排序"
                rules={[{ required: true, message: '请输入排序值' }]}
                extra=""
              >
                <InputNumber min={0} max={9999} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <div className={styles.menuSettings}>
              <div className={styles.settingRow}>
                <div className={styles.settingText}>
                  <Typography.Text id="menu-enabled-label">菜单状态</Typography.Text>
                  <Typography.Text
                    id="menu-enabled-description"
                    type="secondary"
                    className={styles.settingHint}
                  >
                    停用后，当前菜单及下级页面不计入有效菜单。
                  </Typography.Text>
                </div>
                <Form.Item name="enabled" valuePropName="checked" noStyle>
                  <Switch
                    aria-labelledby="menu-enabled-label"
                    aria-describedby="menu-enabled-description"
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                  />
                </Form.Item>
              </div>
              <div className={styles.settingRow}>
                <div className={styles.settingText}>
                  <Typography.Text id="menu-visible-label">菜单栏显示</Typography.Text>
                  <Typography.Text
                    id="menu-visible-description"
                    type="secondary"
                    className={styles.settingHint}
                  >
                    隐藏后不在菜单栏展示，仍可分配访问权限。
                  </Typography.Text>
                </div>
                <Form.Item name="visible" valuePropName="checked" noStyle>
                  <Switch
                    aria-labelledby="menu-visible-label"
                    aria-describedby="menu-visible-description"
                    checkedChildren="显示"
                    unCheckedChildren="隐藏"
                  />
                </Form.Item>
              </div>
            </div>
          </Form>
        </Drawer>
      </PageContainer>
    </div>
  );
}
