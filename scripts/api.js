import { DEVTO_BASE_URL, HN_ALGOLIA_URL, DEFAULT_LIMIT } from "./config.js";

function normalizeDevtoArticle(article) {
  return {
    id: `devto-${article.id}`,
    source: "devto",
    title: article.title,
    excerpt: article.description || "",
    url: article.url,
    author: article.user?.name || "Unknown",
    score: article.public_reactions_count || 0,
    publishedAt: article.published_at,
    tags: article.tag_list || [],
    thumbnail: article.cover_image || article.social_image || null,
    readingTime: article.reading_time_minutes || null,
  };
}

function normalizeHnAlgoliaHit(hit) {
  return {
    id: `hn-${hit.objectID}`,
    source: "hn",
    title: hit.title || "Untitled",
    excerpt: hit.story_text || "",
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    author: hit.author || "Unknown",
    score: hit.points || 0,
    publishedAt: hit.created_at,
    tags: [],
    thumbnail: null,
    readingTime: null,
  };
}

export async function fetchDevtoArticles(signal) {
  const res = await fetch(`${DEVTO_BASE_URL}?per_page=${DEFAULT_LIMIT}`, { signal });
  if (!res.ok) throw new Error("Failed to fetch DEV.to articles");
  const data = await res.json();
  return data.map(normalizeDevtoArticle);
}

export async function fetchHnArticles(signal) {
  const res = await fetch(
    `${HN_ALGOLIA_URL}/search?tags=front_page&hitsPerPage=${DEFAULT_LIMIT}`,
    { signal }
  );
  if (!res.ok) throw new Error("Failed to fetch Hacker News articles");
  const data = await res.json();
  return data.hits.map(normalizeHnAlgoliaHit);
}

export async function searchDevtoArticles(query, signal) {
  const tag = query.trim().toLowerCase().split(/\s+/)[0];
  const res = await fetch(
    `${DEVTO_BASE_URL}?tag=${encodeURIComponent(tag)}&per_page=${DEFAULT_LIMIT}`,
    { signal }
  );
  if (!res.ok) throw new Error("Failed to search DEV.to articles");
  const data = await res.json();
  return data.map(normalizeDevtoArticle);
}

export async function searchHnArticles(query, signal) {
  const res = await fetch(
    `${HN_ALGOLIA_URL}/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${DEFAULT_LIMIT}`,
    { signal }
  );
  if (!res.ok) throw new Error("Failed to search Hacker News");
  const data = await res.json();
  return data.hits.map(normalizeHnAlgoliaHit);
}
