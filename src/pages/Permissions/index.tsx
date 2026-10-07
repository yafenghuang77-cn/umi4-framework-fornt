import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components';
import { Card, Empty, Tabs, Tag } from 'antd';

import routes from '../../../config/routes';

interface Role {
  id: string;
  name: string;
  description: string;
  updatedAt?: string;
}
interface Resource {
  path: string;
  name: string;
  parent: string;
}
interface MenuRoute {
  path: string;
  name?: string;
  hideInMenu?: boolean;
  routes?: MenuRoute[];
}

function getResources(menuRoutes: MenuRoute[], parent = '主导航'): Resource[] {
  return menuRoutes.flatMap((route) => {
    if (route.hideInMenu || !route.name) {
      return [];
    }
    if (route.routes) {
      return getResources(route.routes, route.name);
    }
    return [{ path: route.path, name: route.name, parent }];
  });
}

const roleColumns: Array<ProColumns<Role>> = [
  { title: '角色名称', dataIndex: 'name', width: 220 },
  { title: '职责说明', dataIndex: 'description' },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    valueType: 'dateTime',
    width: 200,
  },
];
const resourceColumns: Array<ProColumns<Resource>> = [
  { title: '资源名称', dataIndex: 'name', width: 180 },
  { title: '所属模块', dataIndex: 'parent', width: 180 },
  { title: '访问路径', dataIndex: 'path', copyable: true },
  { title: '资源类型', key: 'type', width: 140, render: () => <Tag>页面</Tag> },
];

export default function Permissions() {
  return (
    <PageContainer title="权限管理" content="以角色为基础管理访问权限，明确各业务模块的资源边界。">
      <Card>
        <Tabs
          items={[
            {
              key: 'roles',
              label: '角色管理',
              children: (
                <ProTable<Role>
                  rowKey="id"
                  columns={roleColumns}
                  dataSource={[]}
                  search={false}
                  options={false}
                  pagination={false}
                  ghost
                  locale={{
                    emptyText: (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无角色配置" />
                    ),
                  }}
                />
              ),
            },
            {
              key: 'resources',
              label: '权限资源',
              children: (
                <ProTable<Resource>
                  rowKey="path"
                  columns={resourceColumns}
                  dataSource={getResources(routes)}
                  search={false}
                  options={false}
                  pagination={false}
                  ghost
                  scroll={{ x: 680 }}
                />
              ),
            },
          ]}
        />
      </Card>
    </PageContainer>
  );
}
