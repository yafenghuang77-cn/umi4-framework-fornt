import { PlusOutlined } from '@ant-design/icons';
import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Empty } from 'antd';

interface Survey {
  id: string;
  name: string;
  status: 'draft' | 'published' | 'closed';
  responseCount: number;
  updatedAt: string;
}

const columns: Array<ProColumns<Survey>> = [
  { title: '问卷名称', dataIndex: 'name' },
  {
    title: '问卷状态',
    dataIndex: 'status',
    width: 140,
    valueEnum: {
      draft: { text: '草稿', status: 'Default' },
      published: { text: '已发布', status: 'Success' },
      closed: { text: '已结束', status: 'Warning' },
    },
  },
  { title: '回收数量', dataIndex: 'responseCount', width: 140, search: false },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    valueType: 'dateTime',
    width: 200,
    search: false,
  },
];

export default function SurveyList() {
  return (
    <ProTable<Survey>
      rowKey="id"
      headerTitle="调研问卷"
      columns={columns}
      bordered
      dataSource={[]}
      search={{ labelWidth: 'auto', defaultCollapsed: false }}
      options={{ reload: false, density: true, setting: true, fullScreen: true }}
      pagination={false}
      scroll={{ x: 720 }}
      toolBarRender={() => [
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined aria-hidden="true" />}
          onClick={() => history.push('/survey/editor')}
        >
          新增
        </Button>,
      ]}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无调研问卷，点击“新增”开始设置问卷"
          />
        ),
      }}
    />
  );
}
