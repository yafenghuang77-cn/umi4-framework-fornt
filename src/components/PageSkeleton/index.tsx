import './index.less';

import { Card, Skeleton } from 'antd';

export default function PageSkeleton({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={`page-skeleton ${fullScreen ? 'page-skeleton-full' : ''}`}
      role="status"
      aria-label="页面加载中"
      aria-busy="true"
    >
      {fullScreen && (
        <>
          <header className="skeleton-header">
            <img src="/framework/logo.svg" alt="" />
            Ant Design Pro
          </header>
          <aside className="skeleton-sidebar">
            <Skeleton active paragraph={{ rows: 9 }} title={false} />
          </aside>
        </>
      )}
      <div className="skeleton-content">
        <Skeleton active paragraph={false} title={{ width: 280 }} />
        <div className="welcome-grid">
          <Card>
            <Skeleton active paragraph={{ rows: 2 }} />
            <div className="skeleton-banner" />
            <Skeleton active paragraph={{ rows: 8 }} />
          </Card>
          <div className="skeleton-resources">
            {[1, 2, 3].map((n) => (
              <Card key={n}>
                <Skeleton active avatar={{ shape: 'square' }} title paragraph={{ rows: 1 }} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
