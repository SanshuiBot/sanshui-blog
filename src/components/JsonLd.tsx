import type { Post } from '@/lib/types';

const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';
const authorName = '三水';
const socialLinks = {
  github: 'https://github.com/SanshuiBot',
};

export function BlogPostJsonLd({ post }: { post: Post }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: authorName,
      url: `${baseUrl}/about`,
    },
    keywords: post.tags.join(', '),
    url: `${baseUrl}/posts/${post.slug}`,
    publisher: {
      '@type': 'Person',
      name: authorName,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BlogSiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: '三水 | 个人博客',
    description: '记录技术思考、生活感悟与创作灵感',
    url: baseUrl,
    author: {
      '@type': 'Person',
      name: authorName,
      url: `${baseUrl}/about`,
      sameAs: [socialLinks.github],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
