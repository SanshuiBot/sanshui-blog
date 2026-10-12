/**
 * navigation-loading-bootstrap —— 导航等待胶囊的「首屏 / hydration 前」原生前置脚本。
 *
 * 职责：NavigationLoadingProvider 是 React 客户端组件，hydration 完成前与硬跳转的
 * 浏览器原生等待期都无法工作；本工厂输出零依赖 IIFE（注入 <head>，仿 accents.ts
 * 的 theme/search 前置委托），覆盖两段空窗：
 *
 *  A. 首屏文档加载：脚本在 head 执行（readyState=loading）即 arm 300ms 门控，
 *     DOMContentLoaded 前持续 >300ms（弱网/慢服务器）才显示胶囊，DCL/load 即隐藏；
 *  B. hydration 前点击：捕获阶段委托**全部站内路由链接**的左键点击（同源、basePath
 *     之下、非纯锚点、非静态文件，判定与 React 侧 isInternalNavigation 一致），
 *     硬跳转提交前的浏览器等待期里在旧页面上显示胶囊；新文档载入后由阶段 A 接管。
 *
 * 交接：Provider 挂载时写 <html data-nav-loading-ready> 并派发 navloading:ready，
 * 本脚本随即注销全部监听让位（此后点击走 <Link> 客户端导航 + React 胶囊）。
 *
 * 样式全内联/注入：弱网首屏 300ms 时外部 CSS 可能尚未加载，不能依赖 Tailwind/glass。
 */
export function createNavigationLoadingScript(basePath: string): string {
  return `(function(){
  var DELAY = 300, FALLBACK = 10000, EXIT = 260, BASE = ${JSON.stringify(basePath)};
  var PILL_ID = 'nav-loading-pill-pre', STYLE_ID = 'nav-loading-pill-style';
  var showTimer = null, fallbackTimer = null, exitTimer = null, el = null, tornDown = false;
  // 退场中的旧节点：exitTimer 存活期间非 null。show() 打断退场时立即移除它（共享
  // <style> 保留给新胶囊复用）；与 el 互斥（el 非 null 表示在显，exiting 非 null 表示在退）
  var exiting = null;

  function isReady(){
    return tornDown || document.documentElement.hasAttribute('data-nav-loading-ready');
  }
  function isInternalRoute(url){
    if(url.origin !== location.origin) return false;
    var p = url.pathname;
    var baseOk = BASE === '' ? p.charAt(0) === '/' : (p === BASE || p.indexOf(BASE + '/') === 0);
    if(!baseOk) return false;
    // 纯 hash 定位（#anchor 同页滚动）与同 URL 重复点击：无导航
    if(url.pathname === location.pathname && url.search === location.search) return false;
    // 带扩展名的静态文件（feed.xml/og.png/*.txt）：浏览器原生处理，不挂胶囊
    var last = p.replace(/\\/+$/, '').split('/').pop() || '';
    if(/\\.[a-z0-9]+$/i.test(last)) return false;
    return true;
  }
  function accentColor(){
    var v = '';
    try { v = getComputedStyle(document.documentElement).getPropertyValue('--accent-violet-rgb') || ''; } catch(e){}
    v = v.trim();
    return v ? 'rgb(' + v.replace(/,/g, ' ') + ')' : '#8b5cf6';
  }
  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    var st = document.createElement('style');
    st.id = STYLE_ID;
    st.textContent =
      '@keyframes navPrePillSpin{to{transform:rotate(360deg)}}'
      + '#' + PILL_ID + '{position:fixed;top:4.75rem;left:50%;z-index:70;display:inline-flex;'
      + 'align-items:center;gap:.5rem;max-width:calc(100vw - 2rem);padding:.5rem .875rem;'
      + 'border-radius:9999px;pointer-events:none;user-select:none;white-space:nowrap;'
      + 'opacity:0;visibility:hidden;transform:translate(-50%,-.5rem);'
      + 'transition:opacity .18s ease,transform .22s cubic-bezier(.16,1,.3,1),visibility 0s linear .22s;'
      + 'will-change:opacity,transform}'
      + '#' + PILL_ID + '.is-visible{opacity:1;visibility:visible;transform:translate(-50%,0);'
      + 'transition:opacity .2s ease .02s,transform .24s cubic-bezier(.16,1,.3,1)}'
      + '@media (prefers-reduced-motion:reduce){#' + PILL_ID
      + '{transition-duration:.01ms !important}}';
    document.head.appendChild(st);
  }
  function removeStyle(){
    var st = document.getElementById(STYLE_ID);
    if(st) st.remove();
  }
  function show(){
    showTimer = null;
    if(exitTimer){ clearTimeout(exitTimer); exitTimer = null; }
    // 退场被新跳转打断：立即回收旧节点（共享 <style> 保留），再新建胶囊
    if(exiting){ exiting.remove(); exiting = null; }
    if(el){ // 仍在显示（20ms 进场帧前后）：直接恢复并续上兜底
      el.classList.add('is-visible');
      fallbackTimer = setTimeout(hide, FALLBACK);
      return;
    }
    var dark = document.documentElement.classList.contains('dark');
    var bg = dark ? 'rgba(16,16,26,.88)' : 'rgba(255,255,255,.85)';
    var border = dark ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)';
    var shadow = dark ? '0 8px 24px rgba(0,0,0,.35)' : '0 8px 24px rgba(0,0,0,.1)';
    var textColor = dark ? '#d4d4d8' : '#57534e';
    var track = dark ? 'rgba(255,255,255,.14)' : 'rgba(0,0,0,.12)';
    injectStyle();
    el = document.createElement('div');
    el.id = PILL_ID;
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-busy', 'true');
    el.style.cssText = 'background:' + bg + ';-webkit-backdrop-filter:blur(32px) saturate(1.8);'
      + 'backdrop-filter:blur(32px) saturate(1.8);border:1px solid ' + border + ';box-shadow:' + shadow;
    el.innerHTML =
      '<span style="box-sizing:border-box;width:18px;height:18px;flex:none;border-radius:50%;'
      + 'border:2px solid ' + track + ';border-top-color:' + accentColor()
      + ';animation:navPrePillSpin .8s linear infinite"></span>'
      + '<span style="font-size:.8125rem;line-height:1;color:' + textColor + '">页面加载中…</span>';
    (document.body || document.documentElement).appendChild(el);
    // 进场类延迟一帧添加。不用 requestAnimationFrame：<body> 到达前文档可能尚未产生
    // 首个渲染帧，rAF 会挂到正文到齐才触发（胶囊节点已插入却永不显示）。
    // 20ms 定时器与渲染帧无关、必然触发；万一这 20ms 内浏览器还没绘制隐藏首帧，
    // 最坏结果只是首次出现没有淡入（功能不受影响），reduced-motion 下本就瞬切。
    setTimeout(function () {
      if (el) el.classList.add('is-visible');
    }, 20);
    fallbackTimer = setTimeout(hide, FALLBACK);
  }
  function hide(){
    if(showTimer){ clearTimeout(showTimer); showTimer = null; }
    if(fallbackTimer){ clearTimeout(fallbackTimer); fallbackTimer = null; }
    if(el){ // 先走 260ms CSS 淡出再移除节点，避免硬切
      var node = el;
      el = null;
      exiting = node;
      node.classList.remove('is-visible');
      exitTimer = setTimeout(function(){
        exitTimer = null;
        if(exiting === node) exiting = null;
        node.remove();
        if(!el) removeStyle(); // 被新胶囊复用时保留共享样式
      }, EXIT);
    }
  }
  function arm(){
    if(isReady()){ teardown(); return; }
    if(showTimer) clearTimeout(showTimer);
    showTimer = setTimeout(show, DELAY);
  }
  function onClick(e){
    if(isReady()){ teardown(); return; }
    if(e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target;
    if(!t || !t.closest) return;
    var a = t.closest('a[href]');
    if(!a) return;
    if(a.target && a.target !== '_self') return;
    if(a.hasAttribute('download')) return;
    var url;
    try { url = new URL(a.href, location.href); } catch(err){ return; }
    if(!isInternalRoute(url)) return;
    arm();
  }
  function onReady(){ teardown(); }
  function teardown(){
    if(tornDown) return;
    tornDown = true;
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('navloading:ready', onReady, true);
    window.removeEventListener('pagehide', hide, true);
    document.removeEventListener('DOMContentLoaded', hide, true);
    window.removeEventListener('load', hide, true);
    window.removeEventListener('pageshow', hide, true);
    // 取消退场定时器后须自行回收：hide() 见 el===null 会变空操作
    if(exitTimer){ clearTimeout(exitTimer); exitTimer = null; }
    if(exiting){ exiting.remove(); exiting = null; }
    hide();
    if(!el) removeStyle(); // 无在显胶囊（无新退场排程）时同步清样式
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('navloading:ready', onReady, true);
  window.addEventListener('pagehide', hide, true);
  document.addEventListener('DOMContentLoaded', hide, true);
  window.addEventListener('load', hide, true);
  window.addEventListener('pageshow', hide, true);
  // 阶段 A：head 执行时 readyState 必为 'loading'；DCL 前持续 >300ms 才显示
  if(document.readyState === 'loading') arm();
})();`;
}
