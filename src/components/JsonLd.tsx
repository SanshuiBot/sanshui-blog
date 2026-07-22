import type { Post } from '@/lib/types';

const siteName = '三水';
const baseUrl = 'https://sanshuibot.github.io/sanshui-blog';

export function BlogSiteJsonLd() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: siteName,
          description: '记录技术思考、生活感悟与创作灵感',
          url: baseUrl,
          author: { '@type': 'Person', name: siteName },
        }),
      }}
    />
  );
}

export function BlogPostJsonLd({ post }: { post: Post }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          author: { '@type': 'Person', name: siteName },
          url: `${baseUrl}/posts/${post.slug}`,
        }),
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; url: string }[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: `${baseUrl}${item.url}` })),
        }),
      }}
    />
  );
}
