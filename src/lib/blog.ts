import { getCollection } from "astro:content";

export async function getPublishedPosts() {
  return (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function postHref(id: string) {
  return `/blog/${id}/`;
}
