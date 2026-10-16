/**
 * nav-history —— 文章页「返回」按钮的站内导航链（sessionStorage）。
 * -----------------------------
 * 背景（历史 bug，两个移动端专属症状）：
 *  返回按钮原来在挂载时用「同源 referrer + sessionStorage 站内标记」猜「上一条
 *  历史是不是本站」，两个信号都不可靠：
 *   1) referrer 只在文档加载时有效，SPA 软导航后是过期的初始值；
 *   2) 标记由任意页面挂载时写入、pagehide 时清除 —— 移动端切后台也发 pagehide
 *      （PC 切窗口不发），标记被误清 → 之后软导航新挂载时误判「无站内历史」
 *      → 回首页；反过来 reload 后 referrer 变自身同源、标记被本会话首个页面
 *      自身写入而残留 → 误判「有历史」→ history.back() 退到外站条目/空白页。
 *
 * 本模块改成记录**事实**而非猜测：sessionStorage 维护本标签页实际走过的站内
 * 路由栈（含 basePath 的 location.pathname，与 pre-hydration 内联脚本
 * back-button-bootstrap.ts 同键同格式）。链尾 = 当前页，链尾前一项 = 应返回的
 * 上一页；返回按钮只在链条确有上一页时 router.back()，否则走 href="/" 回首页。
 *
 * 生命周期规则（谁写链，实现见组件 NavHistoryTracker）：
 *  - 软导航 / popstate 前进后退：syncNavHistory 镜像历史栈；
 *  - 点击跨域 http(s) 链接离开本站：导航尚未发生即 resetNavHistory(当前页)
 *    —— 离开后再回来（bfcache 恢复或全新加载），浏览器上一条已不是本站页面，
 *      应回首页而非再退到外站；
 *  - reload（移动端下拉刷新）：不截断 —— 下方条目未变，链条原样保留，
 *    pre-hydration 内联脚本与 hydration 后的 tracker 读到的链一致；
 *  - 全新进入（外站 referrer / 空 referrer / 静态文件 referrer）：reset 为
 *    [当前页] —— 下方条目不可信或不存在（书签/地址栏/新标签/标签页恢复）。
 *
 * 所有读写对 sessionStorage 不可用（隐私模式等）静默降级：链为空 → 返回按钮
 * 走默认 href="/" 回首页（与无 JS 行为一致）。
 */
export const NAV_HISTORY_KEY = 'sansui-nav-history';

/** 链条长度上限：超长会话截尾，防写爆 sessionStorage 配额（保留最近记录） */
const MAX_NAV_HISTORY_LENGTH = 100;

function readChain(key: string): string[] {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === 'string' && v.length > 0);
  } catch {
    return [];
  }
}

function writeChain(chain: string[]): void {
  try {
    window.sessionStorage.setItem(NAV_HISTORY_KEY, JSON.stringify(chain));
  } catch {
    /* 配额满/隐私模式：静默降级，链停止更新（返回按钮回退到首页） */
  }
}

/** 读取当前导航链（链尾应为当前页；空数组 = 无记录/不可用） */
export function readNavHistory(): string[] {
  return readChain(NAV_HISTORY_KEY);
}

/**
 * 同步导航链到 pathname（location.pathname，含 basePath）：
 *  - 与链尾相同（reload/重复挂载）：不动，保持幂等；
 *  - 在链中更早位置出现过（浏览器后退/前进回到旧条目）：截断到该处，镜像历史栈；
 *  - 否则（软导航新页面）：追加。
 */
export function syncNavHistory(pathname: string): string[] {
  const chain = readNavHistory();
  if (chain[chain.length - 1] === pathname) return chain;
  const idx = chain.lastIndexOf(pathname);
  const next = idx >= 0 ? chain.slice(0, idx + 1) : [...chain, pathname];
  // 超长会话截尾，防写爆 sessionStorage 配额（保留最近记录）
  const capped =
    next.length > MAX_NAV_HISTORY_LENGTH ? next.slice(next.length - MAX_NAV_HISTORY_LENGTH) : next;
  writeChain(capped);
  return capped;
}

/** 重置为 [pathname]：全新进入（下方无本站条目）/ 离开本站时使用 */
export function resetNavHistory(pathname: string): string[] {
  const next = [pathname];
  writeChain(next);
  return next;
}

/**
 * 返回目标：链条确有上一页、链尾就是当前页、且浏览器确有历史可退时，
 * 返回上一页路径，否则 null。
 *  - 链尾校验防「陈旧链」（如 pre-hydration 时跟踪器尚未同步）误返；
 *  - history.length 守卫防「链与历史栈背离」：复制标签页会复制 sessionStorage
 *    但不复制历史栈（新页 length=1、链却是旧的），此时 router.back() 会静默
 *    无操作 —— 又一个「点了没反应」的诱因，必须放行默认回首页。
 */
export function getBackTarget(pathname: string): string | null {
  if (window.history.length <= 1) return null;
  const chain = readNavHistory();
  if (chain.length < 2) return null;
  if (chain[chain.length - 1] !== pathname) return null;
  return chain[chain.length - 2] ?? null;
}

/** 末段带扩展名的路径视为静态文件（feed.xml/og.png…），与 isInternalNavigation 同规则 */
export function isStaticFilePathname(pathname: string): boolean {
  const lastSegment = pathname.replace(/\/+$/, '').split('/').pop() ?? '';
  return /\.[a-z0-9]+$/i.test(lastSegment);
}
