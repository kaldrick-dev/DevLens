import { appState, toggleSaved, toggleCompare } from "./state.js";

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

// Module-level article map for lookup by id
const articleMap = new Map();

// Track if grid click handler has been attached
let gridClickAttached = false;

// Track if escape handler has been attached
let escapeHandlerAttached = false;

function initEscapeHandler() {
  if (escapeHandlerAttached) return;
  escapeHandlerAttached = true;
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const articleModal = document.getElementById("article-modal");
    const compareOverlay = document.getElementById("compare-overlay");
    if (articleModal && !articleModal.hidden) {
      articleModal.hidden = true;
      document.body.style.overflow = "";
    }
    if (compareOverlay && !compareOverlay.hidden) {
      compareOverlay.hidden = true;
      document.body.style.overflow = "";
    }
  });
}

export function renderArticles(articles) {
  const grid = document.getElementById("articles-grid");
  const template = document.getElementById("article-card-template");
  grid.innerHTML = "";

  // Store in article map for lookup
  articles.forEach((a) => articleMap.set(a.id, a));

  if (articles.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-state";
    p.textContent = "No articles found.";
    grid.appendChild(p);
    attachGridClickHandler(grid);
    return;
  }

  articles.forEach((article) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".article-card");
    card.dataset.id = article.id;

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

    node.querySelector(".article-date").textContent = formatDate(article.publishedAt);
    node.querySelector(".article-title").textContent = article.title;

    const excerpt = node.querySelector(".article-excerpt");
    if (article.excerpt) {
      excerpt.textContent = article.excerpt;
    } else {
      excerpt.remove();
    }

    // Read time
    const readTimeEl = node.querySelector(".article-read-time");
    if (article.readingTime) {
      readTimeEl.textContent = `${article.readingTime} min read`;
    } else {
      readTimeEl.remove();
    }

    // Tags
    const tagsEl = node.querySelector(".article-tags");
    if (article.tags && article.tags.length > 0) {
      article.tags.slice(0, 3).forEach((tag) => {
        const pill = document.createElement("span");
        pill.className = "tag-pill";
        pill.textContent = tag;
        tagsEl.appendChild(pill);
      });
    } else {
      tagsEl.remove();
    }

    node.querySelector(".article-author").textContent = article.author;

    if (article.score > 0) {
      node.querySelector(".article-score").textContent = `${article.score} pts`;
    } else {
      node.querySelector(".article-score").remove();
    }

    // Save button
    const saveBtn = node.querySelector(".article-save-btn");
    if (appState.savedIds.has(article.id)) {
      saveBtn.textContent = "♥";
      saveBtn.classList.add("saved");
    } else {
      saveBtn.textContent = "♡";
      saveBtn.classList.remove("saved");
    }

    // Compare button
    const compareBtn = node.querySelector(".article-compare-btn");
    if (appState.compareIds.includes(article.id)) {
      compareBtn.classList.add("comparing");
    } else {
      compareBtn.classList.remove("comparing");
    }
    if (appState.compareIds.length >= 2 && !appState.compareIds.includes(article.id)) {
      compareBtn.disabled = true;
    }

    const link = node.querySelector(".article-link");
    link.href = article.url;

    grid.appendChild(node);
  });

  attachGridClickHandler(grid);
  initEscapeHandler();
}

function attachGridClickHandler(grid) {
  if (gridClickAttached) return;
  gridClickAttached = true;

  grid.addEventListener("click", (e) => {
    // Let external links propagate naturally
    if (e.target.closest(".article-link")) return;

    const saveBtn = e.target.closest(".article-save-btn");
    if (saveBtn) {
      const card = saveBtn.closest(".article-card");
      if (!card) return;
      const id = card.dataset.id;
      const article = articleMap.get(id);
      if (!article) return;
      toggleSaved(id, article);
      updateSaveButtons();
      return;
    }

    const compareBtn = e.target.closest(".article-compare-btn");
    if (compareBtn) {
      const card = compareBtn.closest(".article-card");
      if (!card) return;
      const id = card.dataset.id;
      toggleCompare(id);
      updateCompareButtons();
      updateCompareBar();
      return;
    }

    // Card body click → open modal
    const card = e.target.closest(".article-card");
    if (!card) return;
    const id = card.dataset.id;
    const article = articleMap.get(id);
    if (!article) return;
    openModal(article);
  });
}

export function renderTrendingTags(articles) {
  const container = document.getElementById("trending-tags");
  if (!container) return;

  // Count tag frequency
  const tagCounts = new Map();
  articles.forEach((a) => {
    (a.tags || []).forEach((tag) => {
      const key = tag.toLowerCase();
      tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
    });
  });

  if (tagCounts.size === 0) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  // Sort by frequency, take top 15
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([tag]) => tag);

  container.innerHTML = "";

  topTags.forEach((tag) => {
    const btn = document.createElement("button");
    btn.className = "tag-pill";
    btn.textContent = tag;
    if (appState.selectedTags.includes(tag)) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      const idx = appState.selectedTags.indexOf(tag);
      if (idx !== -1) {
        appState.selectedTags.splice(idx, 1);
      } else {
        appState.selectedTags.push(tag);
      }
      renderTrendingTags(articles);
      document.dispatchEvent(new CustomEvent("devlens:filter-changed"));
    });
    container.appendChild(btn);
  });
}

export function openModal(article) {
  const overlay = document.getElementById("article-modal");
  if (!overlay) return;

  const thumbEl = overlay.querySelector(".modal-thumb");
  if (article.thumbnail) {
    thumbEl.src = article.thumbnail;
    thumbEl.hidden = false;
  } else {
    thumbEl.src = "";
    thumbEl.hidden = true;
  }

  const sourceBadge = overlay.querySelector(".modal-source-badge");
  sourceBadge.textContent = SOURCE_LABELS[article.source] ?? article.source;
  sourceBadge.style.color = SOURCE_COLORS[article.source] ?? "var(--muted)";

  overlay.querySelector(".modal-date").textContent = formatDate(article.publishedAt);

  const readTimeEl = overlay.querySelector(".modal-read-time");
  if (article.readingTime) {
    readTimeEl.textContent = `${article.readingTime} min read`;
    readTimeEl.hidden = false;
  } else {
    readTimeEl.textContent = "";
    readTimeEl.hidden = true;
  }

  overlay.querySelector(".modal-title").textContent = article.title;
  overlay.querySelector(".modal-excerpt").textContent = article.excerpt || "";

  const tagsContainer = overlay.querySelector(".modal-tags");
  tagsContainer.innerHTML = "";
  (article.tags || []).forEach((tag) => {
    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.textContent = tag;
    tagsContainer.appendChild(pill);
  });

  const readLink = overlay.querySelector(".modal-read-link");
  readLink.setAttribute("href", article.url);

  const saveBtn = overlay.querySelector(".modal-save-btn");
  updateModalSaveBtn(saveBtn, article.id);

  // Remove old save listener and attach fresh
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  updateModalSaveBtn(newSaveBtn, article.id);
  newSaveBtn.addEventListener("click", () => {
    toggleSaved(article.id, article);
    updateModalSaveBtn(newSaveBtn, article.id);
    updateSaveButtons();
  });

  overlay.hidden = false;
  document.body.style.overflow = "hidden";

  // Close on overlay click
  const overlayClickHandler = (e) => {
    if (e.target === overlay) {
      overlay.hidden = true;
      document.body.style.overflow = "";
      overlay.removeEventListener("click", overlayClickHandler);
    }
  };
  overlay.addEventListener("click", overlayClickHandler);

  // Close button
  const closeBtn = overlay.querySelector(".modal-close");
  const closeBtnHandler = () => {
    overlay.hidden = true;
    document.body.style.overflow = "";
    closeBtn.removeEventListener("click", closeBtnHandler);
  };
  closeBtn.addEventListener("click", closeBtnHandler);

  initEscapeHandler();
}

function updateModalSaveBtn(btn, id) {
  if (appState.savedIds.has(id)) {
    btn.textContent = "♥ Saved";
    btn.classList.add("saved");
  } else {
    btn.textContent = "♡ Save for Later";
    btn.classList.remove("saved");
  }
}

export function updateSaveButtons() {
  document.querySelectorAll(".article-card").forEach((card) => {
    const id = card.dataset.id;
    const btn = card.querySelector(".article-save-btn");
    if (!btn) return;
    if (appState.savedIds.has(id)) {
      btn.textContent = "♥";
      btn.classList.add("saved");
    } else {
      btn.textContent = "♡";
      btn.classList.remove("saved");
    }
  });
}

export function updateCompareButtons() {
  document.querySelectorAll(".article-card").forEach((card) => {
    const id = card.dataset.id;
    const btn = card.querySelector(".article-compare-btn");
    if (!btn) return;
    if (appState.compareIds.includes(id)) {
      btn.classList.add("comparing");
      btn.disabled = false;
    } else {
      btn.classList.remove("comparing");
      btn.disabled = appState.compareIds.length >= 2;
    }
  });
}

export function updateCompareBar() {
  const bar = document.getElementById("compare-bar");
  const text = document.getElementById("compare-bar-text");
  const viewBtn = document.getElementById("compare-view-btn");
  if (!bar || !text) return;

  const count = appState.compareIds.length;
  if (count === 0) {
    bar.hidden = true;
    return;
  }

  bar.hidden = false;
  if (count === 1) {
    text.textContent = "1 article selected — pick 1 more to compare";
    viewBtn.hidden = true;
  } else {
    text.textContent = "2 articles ready";
    viewBtn.hidden = false;
  }

  updateCompareButtons();
}

export function openCompareModal() {
  const overlay = document.getElementById("compare-overlay");
  if (!overlay) return;

  const slot0 = document.getElementById("compare-slot-0");
  const slot1 = document.getElementById("compare-slot-1");
  if (!slot0 || !slot1) return;

  const ids = appState.compareIds;
  const articles = ids.map((id) => articleMap.get(id)).filter(Boolean);

  [slot0, slot1].forEach((slot, i) => {
    slot.innerHTML = "";
    const article = articles[i];
    if (!article) return;
    buildCompareSlot(slot, article);
  });

  overlay.hidden = false;
  document.body.style.overflow = "hidden";

  const outsideClickHandler = (e) => {
    if (e.target === overlay) {
      overlay.hidden = true;
      document.body.style.overflow = "";
      overlay.removeEventListener("click", outsideClickHandler);
    }
  };
  overlay.addEventListener("click", outsideClickHandler);

  initEscapeHandler();
}

function buildCompareSlot(slot, article) {
  if (article.thumbnail) {
    const img = document.createElement("img");
    img.className = "compare-thumb";
    img.alt = "";
    img.src = article.thumbnail;
    slot.appendChild(img);
  }

  const meta = document.createElement("div");
  meta.className = "compare-meta";

  const sourceBadge = document.createElement("span");
  sourceBadge.className = "source-badge";
  sourceBadge.textContent = SOURCE_LABELS[article.source] ?? article.source;
  sourceBadge.style.color = SOURCE_COLORS[article.source] ?? "var(--muted)";
  meta.appendChild(sourceBadge);

  const dateSpan = document.createElement("span");
  dateSpan.className = "compare-date";
  dateSpan.textContent = formatDate(article.publishedAt);
  meta.appendChild(dateSpan);

  if (article.readingTime) {
    const rtSpan = document.createElement("span");
    rtSpan.className = "article-read-time";
    rtSpan.textContent = `${article.readingTime} min read`;
    meta.appendChild(rtSpan);
  }

  slot.appendChild(meta);

  const title = document.createElement("h3");
  title.className = "compare-title";
  title.textContent = article.title;
  slot.appendChild(title);

  const excerpt = document.createElement("p");
  excerpt.className = "compare-excerpt";
  excerpt.textContent = article.excerpt || "";
  slot.appendChild(excerpt);

  if (article.tags && article.tags.length > 0) {
    const tagsDiv = document.createElement("div");
    tagsDiv.className = "compare-tags";
    article.tags.slice(0, 5).forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      pill.textContent = tag;
      tagsDiv.appendChild(pill);
    });
    slot.appendChild(tagsDiv);
  }

  const footer = document.createElement("div");
  footer.className = "compare-footer";

  const author = document.createElement("span");
  author.className = "article-author";
  author.textContent = article.author;
  footer.appendChild(author);

  const readLink = document.createElement("a");
  readLink.className = "btn-primary";
  readLink.textContent = "Read Original ↗";
  readLink.setAttribute("href", article.url);
  readLink.setAttribute("target", "_blank");
  readLink.setAttribute("rel", "noopener noreferrer");
  footer.appendChild(readLink);

  slot.appendChild(footer);
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
