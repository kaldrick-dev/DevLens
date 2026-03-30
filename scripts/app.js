import {
  fetchDevtoArticles,
  fetchHnArticles,
  searchDevtoArticles,
  searchHnArticles,
} from "./api.js";
import { appState, getSavedArticles } from "./state.js";
import { applyFilters } from "./filters.js";
import {
  renderArticles,
  setStatus,
  showLoader,
  renderTrendingTags,
  updateCompareBar,
  openCompareModal,
} from "./ui.js";

let currentController = null;

function refreshView() {
  if (appState.lens === "saved") {
    const saved = getSavedArticles();
    renderArticles(saved);
    setStatus(`${saved.length} saved article${saved.length !== 1 ? "s" : ""}`);
    renderTrendingTags(appState.articles);
    return;
  }

  const filtered = applyFilters(appState.articles, appState);
  renderArticles(filtered);
  setStatus(`${filtered.length} article${filtered.length !== 1 ? "s" : ""}`);
  renderTrendingTags(appState.articles);
}

async function loadArticles(query = null) {
  if (currentController) currentController.abort();
  currentController = new AbortController();
  const { signal } = currentController;

  showLoader();
  setStatus(query ? `Searching "${query}"…` : "Fetching articles…");

  try {
    const [devto, hn] = query
      ? await Promise.all([
          searchDevtoArticles(query, signal),
          searchHnArticles(query, signal),
        ])
      : await Promise.all([
          fetchDevtoArticles(signal),
          fetchHnArticles(signal),
        ]);

    appState.articles = [...devto, ...hn];
    refreshView();
  } catch (error) {
    if (error.name === "AbortError") return;
    setStatus(`Failed to load: ${error.message}`);
    renderArticles([]);
  }
}

let searchTimeout = null;

function wireControls() {
  const searchInput = document.getElementById("search-input");
  const sourceFilter = document.getElementById("source-filter");
  const sortFilter = document.getElementById("sort-filter");
  const dateFilter = document.getElementById("date-filter");

  searchInput.addEventListener("input", (event) => {
    const query = event.target.value.trim();
    appState.query = query;

    clearTimeout(searchTimeout);
    if (query.length === 0) {
      searchTimeout = setTimeout(() => loadArticles(null), 300);
    } else if (query.length >= 2) {
      searchTimeout = setTimeout(() => loadArticles(query), 400);
    }
  });

  sourceFilter.addEventListener("change", (event) => {
    appState.source = event.target.value;
    refreshView();
  });

  sortFilter.addEventListener("change", (event) => {
    appState.sort = event.target.value;
    refreshView();
  });

  dateFilter.addEventListener("change", (event) => {
    appState.dateRange = event.target.value;
    refreshView();
  });

  document.getElementById("lens-tabs").addEventListener("click", (event) => {
    const button = event.target.closest(".lens-tab");
    if (!button) return;

    document
      .querySelectorAll(".lens-tab")
      .forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    appState.lens = button.dataset.lens;

    refreshView();
  });

  document.addEventListener("devlens:filter-changed", () => {
    refreshView();
  });

  const compareViewBtn = document.getElementById("compare-view-btn");
  if (compareViewBtn) {
    compareViewBtn.addEventListener("click", () => {
      openCompareModal();
    });
  }

  const compareClearBtn = document.getElementById("compare-clear-btn");
  if (compareClearBtn) {
    compareClearBtn.addEventListener("click", () => {
      appState.compareIds = [];
      updateCompareBar();
      refreshView();
    });
  }

  const compareClose = document.getElementById("compare-close");
  if (compareClose) {
    compareClose.addEventListener("click", () => {
      document.getElementById("compare-overlay").hidden = true;
      document.body.style.overflow = "";
    });
  }
}

wireControls();
loadArticles();
