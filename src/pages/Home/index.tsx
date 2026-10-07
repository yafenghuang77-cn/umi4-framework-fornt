import { useState } from 'react';

import { GithubOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Card } from 'antd';

import styles from './index.less';

const resources = [
  {
    title: '了解 umi',
    description: 'umi 是一个可扩展的企业级前端应用框架，以路由为基础，支持配置式路由和约定式路由。',
    href: 'https://umijs.org/docs/introduce/introduce',
  },
  {
    title: '了解 Ant Design',
    description:
      'antd 是基于 Ant Design 设计体系的 React UI 组件库，主要用于研发企业级中后台产品。',
    href: 'https://ant.design',
  },
  {
    title: '了解 Pro Components',
    description:
      'ProComponents 是基于 Ant Design 的高阶组件，让每一个组件都能成为一个页面开发理念。',
    href: 'https://procomponents.ant.design',
  },
];
const features = [
  ['React 19 + antd 6 + Umi Max 4', '新一代企业级 React 应用技术栈'],
  ['ProComponents 3', '使用新版 ProLayout、PageContainer 和 ProTable'],
  ['布局与导航', '顶部导航、可折叠侧栏、多级菜单和移动端适配'],
  ['React Query', '通过 @tanstack/react-query 管理服务端数据'],
  ['OpenAPI', '从接口定义生成类型与请求代码'],
  ['加载体验', '首屏与路由切换骨架屏，保留页面布局'],
  ['更多', '权限控制、国际化、主题设置和全局状态管理'],
];

export default function HomePage() {
  const intl = useIntl();
  const [imageError, setImageError] = useState(false);
  return (
    <PageContainer
      breadcrumb={{ items: [] }}
      title={
        <>
          {intl.formatMessage({
            id: 'welcome.title',
            defaultMessage: '欢迎使用 Ant Design Pro',
          })}{' '}
          <span className={styles.version}>V6</span>🎉
        </>
      }
    >
      <div className="welcome-grid">
        <Card className={styles.cheatsheet}>
          <h1>Ant Design Pro Cheatsheet</h1>
          <div className={styles.badges}>
            <a href="https://github.com/ant-design/ant-design-pro" target="_blank" rel="noreferrer">
              <span>
                <GithubOutlined /> GitHub
              </span>
              <span>ant-design/ant-design-pro</span>
            </a>
            <a
              href="https://github.com/ant-design/ant-design-pro/releases"
              target="_blank"
              rel="noreferrer"
            >
              <span>Ant Design Pro</span>
              <span className={styles.blueBadge}>v6</span>
            </a>
            <a href="https://nodejs.org" target="_blank" rel="noreferrer">
              <span>Node.js</span>
              <span className={styles.greenBadge}>≥ 22</span>
            </a>
          </div>
          <div className={styles.hero}>
            {imageError ? (
              <div className={styles.heroFallback}>
                <div className={styles.heroBrand}>
                  <img src="/framework/logo.svg" alt="" />
                  Ant Design <span>Pro</span>
                </div>
                <h2>
                  Ant Design Pro
                  <br />
                  <span>Cheatsheet</span>
                </h2>
                <p>
                  Quick reference for building powerful
                  <br />
                  enterprise-grade applications
                </p>
                <div>Components | Layout | Hooks | Utils</div>
              </div>
            ) : (
              <img
                className={styles.heroImage}
                src="/framework/cheatsheet.png"
                alt="Ant Design Pro Cheatsheet：企业级应用组件、布局、Hooks 与工具速查"
                width={1500}
                height={506}
                onError={() => setImageError(true)}
              />
            )}
          </div>
          <section className={styles.section}>
            <h2>🎉 v6 新特性</h2>
            <ul>
              {features.map(([title, description]) => (
                <li key={title}>
                  <strong>{title}</strong>：{description}
                </li>
              ))}
            </ul>
            <a
              href="https://github.com/ant-design/ant-design-pro/releases/tag/v6.0.0"
              target="_blank"
              rel="noreferrer"
            >
              → 查看完整更新日志
            </a>
          </section>
          <section className={styles.section}>
            <h2>快速开始</h2>
            <p>
              <strong>启动项目：</strong>
            </p>
            <pre>
              <code>
                <span>pnpm</span> install{'\n'}
                <span>pnpm</span> dev
              </code>
            </pre>
            <p>在现有布局中添加业务页面：</p>
            <ul>
              <li>
                在 <code>src/pages/</code> 创建页面组件。
              </li>
              <li>
                在 <code>config/routes.ts</code> 配置路由与菜单。
              </li>
              <li>
                使用 <code>PageContainer</code> 和 <code>ProCard</code> 组织页面内容。
              </li>
            </ul>
          </section>
        </Card>
        <aside className={styles.resources} aria-label="学习资源">
          {resources.map((resource, index) => (
            <a key={resource.href} href={resource.href} target="_blank" rel="noreferrer">
              <Card hoverable size="small">
                <div className={styles.resource}>
                  <span className={styles.number}>{index + 1}</span>
                  <div>
                    <h3>{resource.title}</h3>
                    <p>{resource.description}</p>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </aside>
      </div>
    </PageContainer>
  );
}
