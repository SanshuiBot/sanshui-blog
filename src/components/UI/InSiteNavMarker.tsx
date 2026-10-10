'use client';
import { useEffect } from 'react';
import { markInSiteNav, clearInSiteNav } from '@/components/UI/BackButton';

/**
 * 站内导航标记 —— BackButton「能否 history.back()」的会话信号。
 * 本站任意页面（Providers 包裹的整棵树）挂载时写 sessionStorage 标记；
 * 文档卸载（跳外站/关闭）时经 pagehide 清除——React 的 effect cleanup 在
 * 文档级导航离开时不会执行，必须显式监听 pagehide，否则标记残留会让
 * 「跳外站再回来」的场景误判为站内历史（review 发现的回归）。
 * 关闭标签页场景由 sessionStorage 会话生命周期自愈，双保险。
 */
export default function InSiteNavMarker() {
  useEffect(() => {
    markInSiteNav();
    const onHide = () => clearInSiteNav();
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      clearInSiteNav();
    };
  }, []);
  return null;
}
