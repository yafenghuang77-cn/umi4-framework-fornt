import { useState } from 'react';

import {
  ArrowRightOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { history, useModel } from '@umijs/max';
import { Alert, Button, Form, Input } from 'antd';

import { login, type LoginParams } from '@/services/auth';
import { setToken } from '@/utils/request/token';

import styles from './index.less';

export default function LoginPage() {
  const [loginError, setLoginError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { setInitialState } = useModel('@@initialState');

  const handleLogin = async (values: LoginParams) => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setLoginError(false);
    try {
      const result = await login(values);
      setToken(result.token);
      await setInitialState((state) => ({ ...state!, name: result.name }));
      history.replace('/welcome');
    } catch {
      setLoginError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.introduction} aria-label="系统介绍">
        <div className={styles.brand}>
          <img src="/framework/logo.svg" alt="" width={36} height={36} />
          <span>Ant Design Pro</span>
        </div>
        <div className={styles.introContent}>
          <span className={styles.eyebrow}>企业管理工作台</span>
          <h1>
            有序管理，
            <br />
            高效协作。
          </h1>
          <p>从这里开启工作，让每一项业务井然有序。</p>
          <div className={styles.illustration} aria-hidden="true">
            <div className={styles.previewHeader}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.previewBody}>
              <div className={styles.previewSidebar}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.previewContent}>
                <div className={styles.previewCards}>
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.previewChart}>
                  {[38, 62, 48, 78, 65, 90, 74].map((height, index) => (
                    <span key={index} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.introFooter}>专注业务 · 高效协作 · 统一管理</div>
      </section>

      <section className={styles.formPanel} aria-labelledby="login-title">
        <div className={styles.formContent}>
          <div className={styles.mobileBrand}>
            <img src="/framework/logo.svg" alt="" width={32} height={32} />
            <span>Ant Design Pro</span>
          </div>
          <div className={styles.formHeading}>
            <span className={styles.eyebrow}>欢迎回来</span>
            <h2 id="login-title">登录工作台</h2>
            <p>使用您的账号和密码继续。</p>
          </div>
          {loginError && (
            <div className={styles.error} role="alert">
              <Alert type="error" showIcon title="暂时无法登录，请联系管理员。" />
            </div>
          )}
          <Form<LoginParams>
            name="login"
            layout="vertical"
            size="large"
            requiredMark={false}
            onFinish={handleLogin}
            onValuesChange={() => setLoginError(false)}
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
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
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
          <p className={styles.help}>如需开通账号或重置密码，请联系管理员。</p>
          <div className={styles.security}>
            <SafetyCertificateOutlined aria-hidden="true" />
            <span>请妥善保管您的账号与密码</span>
          </div>
        </div>
        <footer className={styles.footer}>Ant Design Pro 管理系统</footer>
      </section>
    </main>
  );
}
