import { type ReactNode } from 'react';

import { SafetyCertificateOutlined } from '@ant-design/icons';

import styles from './index.less';

interface AuthLayoutProps {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}

export default function AuthLayout({ title, eyebrow, description, children }: AuthLayoutProps) {
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

      <section className={styles.formPanel} aria-labelledby="auth-title">
        <div className={styles.formContent}>
          <div className={styles.mobileBrand}>
            <img src="/framework/logo.svg" alt="" width={32} height={32} />
            <span>Ant Design Pro</span>
          </div>
          <div className={styles.formHeading}>
            <span className={styles.eyebrow}>{eyebrow}</span>
            <h2 id="auth-title">{title}</h2>
            <p>{description}</p>
          </div>
          {children}
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
