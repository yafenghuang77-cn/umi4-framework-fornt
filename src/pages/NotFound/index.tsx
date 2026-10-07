import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Button, Result } from 'antd';

export default function NotFound() {
  return (
    <PageContainer>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在。"
        extra={
          <Button type="primary" onClick={() => history.push('/welcome')}>
            返回欢迎页
          </Button>
        }
      />
    </PageContainer>
  );
}
