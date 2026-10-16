/**
 * back-button-bootstrap —— 文章页「返回」按钮 hydration 前的原生代劳脚本。
 * -----------------------------
 * 背景（移动端专属症状「点了返回却回首页」的第二根因）：
 * 返回按钮 SSR 输出就是 <a href="/">（data-back-link 标）。React onClick 挂载
 * 前，点击走浏览器默认行为 → 全文档导航回首页。移动端首次加载 JS + hydration
 * 需要数秒（PC 快无感），这期间点返回必回首页；与 themeToggleClickScript /
 * searchToggleClickScript（accents.ts）同一根因，同款解法。
 *
 * 行为（<head> 同步执行，document 捕获阶段事件委托）：
 *  - 命中 a[data-back-link]（左键、无修饰键、本标签页、非 download）且
 *    React 尚未接管（html 无 data-back-ready）时：
 *    1) 读 sessionStorage 导航链（sansui-nav-history，与 NavHistoryTracker 同键
 *       同格式；链尾须是当前页，防陈旧链）；
 *    2) 有上一页 → preventDefault + location.assign(上一页)（pre-hydration 无
 *       App Router，全文档导航到链条里的站内路径）；
 *    3) 无上一页 → 放行默认 href="/" 回首页（外站直达/无历史/隐私模式）；
 *  - React 接管后（BackButton 挂载 effect 写 data-back-ready 并派发
 *    backbutton:ready）自注销，交还 React 的 router.back()。
 *
 * 与 back-button 的判定必须保持一致：链尾即当前页、history.length>1、取链尾
 * 前一项。改动任一侧时同步另一侧（导航链格式的唯一权威是 lib/nav-history.ts）。
 */
export function createBackButtonScript(): string {
  return `(function(){
  var KEY = 'sansui-nav-history', READY_ATTR = 'data-back-ready', torn = false;
  function readChain(){
    try {
      var raw = sessionStorage.getItem(KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      if (!arr || Object.prototype.toString.call(arr) !== '[object Array]') return [];
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        if (typeof arr[i] === 'string' && arr[i]) out.push(arr[i]);
      }
      return out;
    } catch (e) { return []; }
  }
  // 与 lib/nav-history.ts getBackTarget 同规则（改动任一侧时同步另一侧）：
  // 链确有上一页、链尾是当前页、且浏览器确有历史可退（复制标签页会复制
  // sessionStorage 但不复制历史栈，length=1 时 back 会无操作，必须放行回首页）
  function backTarget(){
    if (history.length <= 1) return null;
    var c = readChain();
    if (c.length < 2) return null;
    if (c[c.length - 1] !== location.pathname) return null;
    return c[c.length - 2];
  }
  function teardown(){
    if (torn) return;
    torn = true;
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('backbutton:ready', onReady, true);
  }
  function onReady(){ teardown(); }
  function onClick(e){
    if (torn) return;
    // React 已接管（BackButton 挂载写 data-back-ready）：让位
    if (document.documentElement.hasAttribute(READY_ATTR)){ teardown(); return; }
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest('a[href]');
    if (!a || !a.hasAttribute('data-back-link')) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    var target = backTarget();
    if (!target) return; // 无站内上一页：放行默认 href="/" 回首页
    e.preventDefault();
    location.assign(target);
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('backbutton:ready', onReady, true);
})();`;
}
