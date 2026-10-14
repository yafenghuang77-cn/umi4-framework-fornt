import { type CSSProperties } from 'react';

import {
  ArrowRightOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Link, useIntl, useSelector } from '@umijs/max';
import { Card, Tag, theme } from 'antd';

import { type BrandRootState } from '@/models/brand';

import styles from './index.less';

const modules = [
  {
    title: '文件管理',
    description: '添加本地文件或文件链接，预览文档、表格、图片、音视频与压缩包。',
    status: '本地可用',
    ready: true,
    path: '/files/list',
    icon: FolderOpenOutlined,
  },
  {
    title: '性能统计',
    description: '查看当前浏览器的性能趋势、页面体验、请求耗时与异常记录。',
    status: '本地可用',
    ready: true,
    path: '/monitoring/overview',
    icon: DashboardOutlined,
  },
  {
    title: '用户账号',
    description: '已提供账号列表与查询界面，可接入用户身份、账号状态及组织数据。',
    status: '待接入数据',
    ready: false,
    path: '/users/accounts',
    icon: TeamOutlined,
  },
  {
    title: '权限管理',
    description: '查看已有页面资源；角色数据与实际访问权限需要接入业务服务。',
    status: '待接入权限',
    ready: false,
    path: '/admin/permissions',
    icon: SafetyCertificateOutlined,
  },
];

const capabilities = [
  { title: '布局与主题', description: '混合导航、可折叠侧栏、主题颜色和布局设置。' },
  { title: '品牌与语言', description: '品牌选择可持久化，支持语言切换。' },
  { title: '请求与缓存', description: '统一接口请求处理，配合 React Query 管理服务端数据缓存。' },
  { title: '加载与反馈', description: '首屏与路由骨架屏、网络状态提示和异常页面。' },
];

const environments: Record<string, string> = {
  dev: 'DEV · 本地开发',
  uat: 'UAT · 测试环境',
  pre: 'PRE · 预发环境',
  prod: 'PROD · 生产环境',
};

export default function HomePage() {
  const intl = useIntl();
  const { token } = theme.useToken();
  const brand = useSelector((state: BrandRootState) => state.brand.current);
  const environment = process.env.APP_ENV;
  const pageStyle = {
    '--home-primary': token.colorPrimary,
    '--home-primary-text': token.colorPrimaryText,
    '--home-primary-bg': token.colorPrimaryBg,
    '--home-surface': token.colorBgContainer,
    '--home-text': token.colorText,
    '--home-text-secondary': token.colorTextSecondary,
    '--home-border': token.colorBorderSecondary,
    '--home-fill': token.colorFillQuaternary,
  } as CSSProperties;

  return (
    <PageContainer
      breadcrumb={{ items: [] }}
      title={intl.formatMessage({ id: 'welcome.title', defaultMessage: '项目工作台' })}
    >
      <div className={styles.page} style={pageStyle}>
        <Card className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.intro}>
              <span className={styles.eyebrow}>统一管理 · 按需扩展</span>
              <h1>Umi Max 后台管理框架</h1>
              <p>
                面向企业内部管理系统的前端基础模板，整合用户、权限、文件与性能统计入口，
                为业务页面提供统一的布局与交互体验。
              </p>
              <div className={styles.stack} aria-label="项目技术栈">
                {['Umi Max 4', 'React 19', 'TypeScript', 'Ant Design 6', 'ProComponents 3'].map(
                  (name) => (
                    <Tag key={name}>{name}</Tag>
                  ),
                )}
              </div>
            </div>
            <div className={styles.context}>
              <dl>
                <div>
                  <dt>当前品牌</dt>
                  <dd>{brand.name}</dd>
                </div>
                <div>
                  <dt>运行环境</dt>
                  <dd>{environment ? environments[environment] || environment : '未配置'}</dd>
                </div>
              </dl>
              <p>通过顶部菜单切换品牌，通过右侧设置入口调整布局与主题。</p>
            </div>
          </div>
        </Card>

        <section aria-labelledby="home-modules-title">
          <div className={styles.sectionHeader}>
            <h2 id="home-modules-title">常用功能</h2>
            <span>从这里进入项目的主要模块</span>
          </div>
          <div className={styles.moduleGrid}>
            {modules.map(({ title, description, status, ready, path, icon: Icon }) => (
              <Link key={path} to={path} className={styles.moduleLink}>
                <Card className={styles.moduleCard}>
                  <div className={styles.moduleTop}>
                    <span className={styles.moduleIcon}>
                      <Icon aria-hidden="true" />
                    </span>
                    <Tag color={ready ? 'success' : 'default'}>{status}</Tag>
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <span className={styles.moduleAction}>
                    进入模块 <ArrowRightOutlined aria-hidden="true" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <div className={styles.detailGrid}>
          <Card className={styles.detailCard}>
            <h2>框架基础能力</h2>
            <p className={styles.sectionDescription}>复用已有能力，专注业务功能的实现。</p>
            <div className={styles.capabilityGrid}>
              {capabilities.map(({ title, description }) => (
                <div className={styles.capability} key={title}>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className={styles.detailCard}>
            <h2>使用与接入说明</h2>
            <ul className={styles.notes}>
              <li>
                <strong>业务接入</strong>
                <p>登录使用模拟实现；用户、角色、用户分组及配置页面需按业务需求接入或完善。</p>
              </li>
              <li>
                <strong>品牌选择</strong>
                <p>当前保存的是品牌选择，业务接口的数据隔离与权限校验需由服务端实现。</p>
              </li>
              <li>
                <strong>本地数据</strong>
                <p>文件列表仅在当前页面会话中保留；性能统计默认读取当前浏览器的采集记录。</p>
              </li>
            </ul>
            <Link to="/monitoring/query" className={styles.queryLink}>
              查询性能记录 <ArrowRightOutlined aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
