'use client';

import { useEffect } from 'react';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';

/** 挂载时通知覆盖层"页面内容已就绪"——仅用于文章详情页 */
export default function PostDone() {
  const { done } = useNavigationLoading();

  useEffect(() => {
    done();
  }, [done]);

  return null;
}
