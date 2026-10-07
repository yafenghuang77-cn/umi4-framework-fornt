// Render before the JavaScript bundle is ready; React takes over once #root mounts.
(() => {
  function mount() {
    const root = document.getElementById('root');
    if (root && root.childElementCount) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'initial-loading-style';
    style.textContent = `#initial-loading{position:fixed;inset:0;z-index:999;background:#f5f5f5;font-family:system-ui,sans-serif;color:#222}#initial-loading *{box-sizing:border-box}.boot-header{height:56px;display:flex;align-items:center;gap:10px;padding:0 20px;background:white;border-bottom:1px solid #eee;font-size:18px;font-weight:600}.boot-header img{width:28px}.boot-sidebar{position:absolute;top:56px;bottom:0;width:256px;padding:24px;border-right:1px solid #eee}.boot-bar{height:16px;border-radius:4px;background:linear-gradient(90deg,#eee 25%,#f8f8f8 50%,#eee 75%);background-size:200% 100%;animation:boot-shimmer 1.5s infinite;margin-bottom:24px}.boot-main{margin-left:256px;padding:28px 40px}.boot-grid{display:grid;grid-template-columns:2fr 1fr;gap:24px}.boot-card{padding:24px;background:white;border:1px solid #eee;border-radius:6px}.boot-banner{aspect-ratio:3/1;background:#f0f0f0;border-radius:6px;margin:24px 0}.boot-resource{margin-bottom:16px}.boot-resource .boot-bar:last-child{margin:0}@keyframes boot-shimmer{to{background-position:-200% 0}}@media(max-width:991px){.boot-grid{grid-template-columns:1fr}}@media(max-width:767px){.boot-sidebar{display:none}.boot-main{margin-left:0;padding:24px 16px}}@media(prefers-reduced-motion:reduce){.boot-bar{animation:none}}`;
    document.head.appendChild(style);
    const screen = document.createElement('div');
    screen.id = 'initial-loading';
    screen.setAttribute('role', 'status');
    screen.setAttribute('aria-label', '页面加载中');
    const bar = '<div class="boot-bar"></div>';
    screen.innerHTML =
      '<div class="boot-header"><img src="/framework/logo.svg" alt="">Ant Design Pro</div><div class="boot-sidebar">' +
      bar.repeat(9) +
      '</div><div class="boot-main"><div class="boot-bar" style="width:280px;max-width:100%"></div><div class="boot-grid"><div class="boot-card">' +
      bar +
      '<div class="boot-banner"></div>' +
      bar.repeat(7) +
      '</div><div>' +
      ('<div class="boot-card boot-resource">' + bar.repeat(2) + '</div>').repeat(3) +
      '</div></div></div>';
    document.body.appendChild(screen);
    const observer = new MutationObserver(() => {
      const app = document.getElementById('root');
      if (app && app.childElementCount) {
        screen.remove();
        style.remove();
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
