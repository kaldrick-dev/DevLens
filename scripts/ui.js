function formatDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const SOURCE_LABELS = { devto: "DEV.to", hn: "HN" };
const SOURCE_COLORS = { devto: "#7c5cfc", hn: "#ff6600" };

export function renderArticles(articles) {
  const grid = document.getElementById("articles-grid");
  const template = document.getElementById("article-card-template");
  grid.innerHTML = "";

  if (articles.length === 0) {
    grid.innerHTML = '<p class="empty-state">No articles found.</p>';
    return;
  }

  articles.forEach((article) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".article-card");

    const thumb = node.querySelector(".article-thumb");
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    if (article.thumbnail) {
      img.src = article.thumbnail;
    } else {
      img.src = "assets/icons/DevLens.png";
      img.classList.add("thumb-placeholder");
    }
    thumb.appendChild(img);

    const badge = node.querySelector(".source-badge");
    badge.textContent = SOURCE_LABELS[article.source] ?? article.source;
    badge.style.color = SOURCE_COLORS[article.source] ?? "var(--muted)";

    node.querySelector(".article-date").textContent = formatDate(
      article.publishedAt,
    );
    node.querySelector(".article-title").textContent = article.title;

    const excerpt = node.querySelector(".article-excerpt");
    if (article.excerpt) {
      excerpt.textContent = article.excerpt;
    } else {
      excerpt.remove();
    }

    node.querySelector(".article-author").textContent = article.author;

    if (article.score > 0) {
      node.querySelector(".article-score").textContent = `${article.score} pts`;
    } else {
      node.querySelector(".article-score").remove();
    }

    const link = node.querySelector(".article-link");
    link.href = article.url;

    grid.appendChild(node);
  });
}

export function setStatus(message) {
  const status = document.getElementById("status");
  status.textContent = message;
}

export function showLoader() {
  const grid = document.getElementById("articles-grid");
  grid.innerHTML = Array.from(
    { length: 8 },
    () => `
    <div class="skeleton-card">
      <div class="skeleton-thumb shimmer"></div>
      <div class="skeleton-body">
        <div class="skeleton-line shimmer" style="width:35%"></div>
        <div class="skeleton-line shimmer" style="width:90%"></div>
        <div class="skeleton-line shimmer" style="width:75%"></div>
        <div class="skeleton-line shimmer" style="width:55%"></div>
      </div>
    </div>
  `,
  ).join("");
}

export function hideLoader() {
  // grid gets replaced by renderArticles
}
