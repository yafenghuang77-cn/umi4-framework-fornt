import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';

/** 根据查询区、工具栏和分页器的实际高度，分配 ProTable 的滚动区域。 */
export default function useTableLayout() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(240);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = viewport?.closest<HTMLElement>('.ant-pro-layout-content');
    if (!viewport || !content) {
      return;
    }
    const originalOverflow = content.style.overflowY;
    content.style.overflowY = 'hidden';
    content.scrollTop = 0;
    let frame = 0;

    const measure = () => {
      const height = Math.max(
        0,
        content.getBoundingClientRect().bottom -
          viewport.getBoundingClientRect().top -
          parseFloat(getComputedStyle(content).paddingBottom),
      );
      if (viewport.style.height !== `${height}px`) {
        viewport.style.height = `${height}px`;
      }
      const body = viewport.querySelector<HTMLElement>('.ant-table-body');
      if (!body) {
        return;
      }
      const pagination = viewport.querySelector<HTMLElement>('.ant-pagination');
      const paginationStyle = pagination && getComputedStyle(pagination);
      const footerHeight =
        pagination && paginationStyle
          ? pagination.getBoundingClientRect().height +
            parseFloat(paginationStyle.marginTop) +
            parseFloat(paginationStyle.marginBottom)
          : 0;
      setScrollY(
        Math.max(
          0,
          Math.floor(
            viewport.getBoundingClientRect().bottom -
              body.getBoundingClientRect().top -
              footerHeight,
          ),
        ),
      );
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    const observeParts = () => {
      viewport
        .querySelectorAll(
          '.ant-pro-table-search, .ant-pro-table-list-toolbar, .ant-table-header, .ant-pagination',
        )
        .forEach((element) => resize.observe(element, { box: 'border-box' }));
      schedule();
    };
    resize.observe(content);
    resize.observe(viewport);
    const mutations = new MutationObserver(observeParts);
    mutations.observe(viewport, { childList: true, subtree: true });
    window.addEventListener('resize', schedule);
    observeParts();

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener('resize', schedule);
      content.style.overflowY = originalOverflow;
    };
  }, []);

  const viewportStyle = { '--table-body-height': `${scrollY}px` } as CSSProperties;
  return { viewportRef, viewportStyle, scrollY };
}
