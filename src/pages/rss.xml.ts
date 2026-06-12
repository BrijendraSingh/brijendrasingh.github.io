import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../config/site';
import { getPublishedPostsForSite } from '../lib/server/posts';

export async function GET(context: APIContext) {
  const { posts } = await getPublishedPostsForSite({ limit: 100 });

  return rss({
    title: site.brand,
    description: site.description,
    site: context.site ?? site.url,
    items: posts.map((post) => ({
      title: post.title,
      pubDate: new Date(post.published_at || post.pub_date || post.created_at),
      description: post.description,
      link: `/blog/${post.slug}/`,
    })),
  });
}
