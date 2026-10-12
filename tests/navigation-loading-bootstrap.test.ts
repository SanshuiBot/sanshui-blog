/**
 * createNavigationLoadingScript 冒烟契约：
 *  - basePath 被 JSON 安全地内联（dev 空串 / GitHub Pages /sanshui-blog 双态）；
 *  - 关键接线点存在（胶囊/样式节点 id、全站内部路由判定、React 交接事件、300ms 门控）。
 *  脚本本体的 DOM 行为由组件测试（isInternalNavigation 同构判定）与浏览器弱网实测覆盖。
 */
import { describe, expect, it } from 'vitest';
import { createNavigationLoadingScript } from '@/lib/navigation-loading-bootstrap';

describe('createNavigationLoadingScript', () => {
  it('dev 空 basePath：内联 BASE = ""，判定不依赖 /posts/ 前缀', () => {
    const s = createNavigationLoadingScript('');
    expect(s).toContain('BASE = ""');
    expect(s).not.toContain('isPostPath');
  });

  it('GitHub Pages：内联 BASE = "/sanshui-blog" 且含全站委托接线', () => {
    const s = createNavigationLoadingScript('/sanshui-blog');
    expect(s).toContain('BASE = "/sanshui-blog"');
    expect(s).toContain('isInternalRoute');
    expect(s).toContain('nav-loading-pill-pre');
    expect(s).toContain('navloading:ready');
    expect(s).toContain('data-nav-loading-ready');
    expect(s).toContain('var DELAY = 300');
    expect(s).toContain('FALLBACK = 10000');
    expect(s).toContain('DOMContentLoaded');
    expect(s).toContain("closest('a[href]')");
    // 排除项：静态文件扩展名判定
    expect(s).toContain('[a-z0-9]+$');
  });

  it('basePath 经 JSON.stringify 转义，引号不会截断脚本字符串', () => {
    const s = createNavigationLoadingScript('"');
    expect(s).toContain('BASE = "\\""');
  });
});
