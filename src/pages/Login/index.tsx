import { useState } from 'react';

import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { history, Link, useLocation, useModel } from '@umijs/max';
import { Alert, Button, Form, Input } from 'antd';

import AuthLayout from '@/components/AuthLayout';
import styles from '@/components/AuthLayout/index.less';
import { login, type LoginParams } from '@/services/auth';
import { getRequestErrorMessage } from '@/utils/request/error';
import { setToken } from '@/utils/request/token';

export default function LoginPage() {
  const { search } = useLocation();
  const username = new URLSearchParams(search).get('username') || '';
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { setInitialState } = useModel('@@initialState');

  const handleLogin = async (values: LoginParams) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setLoginError('');
    try {
      const result = await login(values);
      setToken(result.tokenValue, { tokenName: result.tokenName, tokenPrefix: result.tokenPrefix });
      await setInitialState((state) => ({ ...state!, name: result.user.username }));
      history.replace('/welcome');
    } catch (error) {
      setLoginError(getRequestErrorMessage(error, '暂时无法登录，请联系管理员。'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="登录工作台" eyebrow="欢迎回来" description="使用您的账号和密码继续。">
      {loginError && (
        <div className={styles.error}>
          <Alert type="error" showIcon title={loginError} />
        </div>
      )}
      <Form<LoginParams>
        name="login"
        layout="vertical"
        size="large"
        requiredMark={false}
        initialValues={{ username }}
        onFinish={handleLogin}
        onValuesChange={() => setLoginError('')}
      >
        <Form.Item
          name="username"
          label="账号"
          rules={[{ required: true, whitespace: true, message: '请输入账号' }]}
        >
          <Input
            prefix={<UserOutlined aria-hidden="true" />}
            placeholder="请输入账号"
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
          <Input.Password
            prefix={<LockOutlined aria-hidden="true" />}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          block
          loading={submitting}
          className={styles.submit}
        >
          登录 <ArrowRightOutlined aria-hidden="true" />
        </Button>
      </Form>
      <div className={styles.switchAccount}>
        <span>还没有账号？</span>
        <Link to="/user/register" className={styles.accountLink}>
          注册账号
        </Link>
      </div>
      <p className={styles.help}>如需重置密码，请联系管理员。</p>
    </AuthLayout>
  );
}
