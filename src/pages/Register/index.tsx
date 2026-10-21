import { useState } from 'react';

import { ArrowRightOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { Link } from '@umijs/max';
import { Alert, Button, Form, Input, Result } from 'antd';

import AuthLayout from '@/components/AuthLayout';
import styles from '@/components/AuthLayout/index.less';
import { type LoginParams, register } from '@/services/auth';
import { getRequestErrorMessage } from '@/utils/request/error';

interface RegisterFormValues extends LoginParams {
  confirmPassword: string;
}

export default function RegisterPage() {
  const [submitting, setSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [registeredUsername, setRegisteredUsername] = useState<string>();

  const handleRegister = async ({ username, password }: RegisterFormValues) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setRegisterError('');
    try {
      const result = await register({ username: username.trim(), password });
      setRegisteredUsername(result.username);
    } catch (error) {
      setRegisterError(getRequestErrorMessage(error, '注册失败，请稍后重试或联系管理员。'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="注册账号" eyebrow="欢迎加入" description="创建您的账号，开启高效协作。">
      {registeredUsername ? (
        <Result
          status="success"
          title="注册成功"
          subTitle={`账号 ${registeredUsername} 已注册，请前往登录。`}
          extra={
            <Link
              to={`/user/login?username=${encodeURIComponent(registeredUsername)}`}
              className={styles.accountLink}
            >
              前往登录 <ArrowRightOutlined aria-hidden="true" />
            </Link>
          }
        />
      ) : (
        <>
          {registerError && (
            <div className={styles.error}>
              <Alert type="error" showIcon title={registerError} />
            </div>
          )}
          <Form<RegisterFormValues>
            name="register"
            layout="vertical"
            size="large"
            requiredMark={false}
            scrollToFirstError={{ focus: true }}
            onFinish={handleRegister}
            onValuesChange={() => setRegisterError('')}
          >
            <Form.Item
              name="username"
              label="账号"
              validateTrigger="onBlur"
              rules={[
                { required: true, whitespace: true, message: '请输入账号' },
                {
                  pattern: /^[a-zA-Z0-9_]{4,32}$/,
                  transform: (value: string) => value?.trim(),
                  message: '账号需为 4–32 位字母、数字或下划线',
                },
              ]}
            >
              <Input
                prefix={<UserOutlined aria-hidden="true" />}
                placeholder="4–32 位字母、数字或下划线"
                autoComplete="username"
                maxLength={32}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              validateTrigger="onBlur"
              rules={[
                { required: true, whitespace: true, message: '请输入密码' },
                { min: 8, max: 64, message: '密码长度需为 8–64 位' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined aria-hidden="true" />}
                placeholder="8–64 位，不能全部为空白字符"
                autoComplete="new-password"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              validateTrigger="onBlur"
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined aria-hidden="true" />}
                placeholder="请再次输入密码"
                autoComplete="new-password"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              className={styles.submit}
            >
              注册 <ArrowRightOutlined aria-hidden="true" />
            </Button>
          </Form>
          <div className={styles.switchAccount}>
            <span>已有账号？</span>
            <Link to="/user/login" className={styles.accountLink}>
              返回登录
            </Link>
          </div>
        </>
      )}
    </AuthLayout>
  );
}
