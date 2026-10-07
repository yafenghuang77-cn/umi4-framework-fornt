import { PageContainer, type ProColumns, ProTable } from '@ant-design/pro-components';
import { Empty } from 'antd';

interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  group: string;
  status: 'active' | 'disabled';
  lastLoginAt?: string;
}

const columns: Array<ProColumns<UserAccount>> = [
  { title: '姓名', dataIndex: 'name', width: 140 },
  { title: '登录账号', dataIndex: 'username', width: 160 },
  { title: '邮箱', dataIndex: 'email', search: false },
  { title: '所属分组', dataIndex: 'group', search: false },
  {
    title: '账号状态',
    dataIndex: 'status',
    width: 120,
    valueEnum: {
      active: { text: '正常', status: 'Success' },
      disabled: { text: '已停用', status: 'Default' },
    },
  },
  {
    title: '最近登录',
    dataIndex: 'lastLoginAt',
    valueType: 'dateTime',
    search: false,
  },
];

export default function Users() {
  return (
    <PageContainer title="用户账号" content="统一管理用户身份、账号状态与组织归属。">
      <ProTable<UserAccount>
        rowKey="id"
        headerTitle="账号目录"
        columns={columns}
        dataSource={[]}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        options={{
          reload: false,
          density: true,
          setting: true,
          fullScreen: true,
        }}
        pagination={false}
        scroll={{ x: 900 }}
        locale={{
          emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无用户账号" />,
        }}
      />
    </PageContainer>
  );
}
