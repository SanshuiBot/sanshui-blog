'use client';
import Link from 'next/link';
import { useNavigationLoading } from '@/components/UI/NavigationLoading';

/** 服务端组件里无法直接调用 useNavigationLoading，包一层客户端组件给跳转链接加导航加载指示 */
export default function ViewAllLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  const { startNavigation } = useNavigationLoading();
  return (
    <Link href={href} className={className} onClick={startNavigation}>
      {children}
    </Link>
  );
}
