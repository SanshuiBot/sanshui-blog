import 'server-only';

export interface Post {
  slug: string;
  title: string;
  date: string;
  /** 可选更新日期（frontmatter updated，YYYY-MM-DD）；缺省表示从未修订 */
  updated?: string;
  excerpt: string;
  tags: string[];
  content: string;
  readingTime?: number;
}
