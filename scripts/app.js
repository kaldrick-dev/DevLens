import { fetchDevtoArticles, fetchHnArticles, searchDevtoArticles, searchHnArticles } from "./api.js";
import { appState } from "./state.js";
import { applyFilters } from "./filters.js";
import { renderArticles, setStatus, showLoader } from "./ui.js";

let currentController = null;

function refreshView() {
  const filtered = applyFilters(appState.articles, appState);
  renderArticles(filtered);
  setStatus(`${filtered.length} article${filtered.length !== 1 ? "s" : ""}`);
}

async function loadArticles(query = null) {
  if (currentController) currentController.abort();
  currentController = new AbortController();
  const { signal } = currentController;

  showLoader();
  setStatus(query ? `Searching "${query}"…` : "Fetching articles…");

  try {
    const [devto, hn] = query
      ? await Promise.all([searchDevtoArticles(query, signal), searchHnArticles(query, signal)])
      : await Promise.all([fetchDevtoArticles(signal), fetchHnArticles(signal)]);

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

  document.getElementById("lens-tabs").addEventListener("click", (event) => {
    const button = event.target.closest(".lens-tab");
    if (!button) return;

    document.querySelectorAll(".lens-tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    appState.lens = button.dataset.lens;

    refreshView();
  });
}

wireControls();
loadArticles();
