import { PageContainer } from '@ant-design/pro-components';
import { useRouteProps } from '@umijs/max';
import { Card, Empty } from 'antd';

export default function Placeholder() {
  const { name } = useRouteProps<{ name?: string }>();
  return (
    <PageContainer title={name || '页面'}>
      <Card>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="布局已就绪，可在此添加业务内容" />
      </Card>
    </PageContainer>
  );
}
