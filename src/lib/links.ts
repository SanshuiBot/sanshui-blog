/**
 * 友链数据字典
 * -----------------------------
 * 所有友情链接统一在此维护，新增友链只需 push 一条对象即可。
 *
 * 字段说明：
 *  - name    显示名称
 *  - url     跳转地址
 *  - desc    简短描述
 *  - icon    可选，自定义图标组件
 *  - color   卡片左侧彩色圆点（十六进制，用于区分不同类型友链）
 */
import { siteConfig } from './site';
import GithubIcon from '@/components/UI/GithubIcon';

export interface FriendLink {
  name: string;
  url: string;
  desc: string;
  /** 自定义图标组件（可选） */
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  /** 手动指定的 favicon URL（可选），不填则自动从 url 域名获取 */
  faviconUrl?: string;
  /** 卡片左侧圆点颜色，默认使用 accent-violet */
  color?: string;
}

export const friendLinks: FriendLink[] = [
  {
    name: 'GitHub',
    url: siteConfig.github,
    desc: '三水github项目仓库',
    icon: GithubIcon,
    color: '#58a6ff',
  },
  {
    name: 'dreamxj-个人网站',
    url: 'https://dreamxj.github.io/my_blog_vue/',
    desc: '技术分享型个人网站',
    color: '#a78bfa',
  },
];
