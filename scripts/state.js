const _savedData = JSON.parse(localStorage.getItem("devlens_saved_data") || "{}");

export const appState = {
  query: "",
  source: "all",
  sort: "newest",
  lens: "all",
  dateRange: "all",
  selectedTags: [],
  compareIds: [],
  savedIds: new Set(Object.keys(_savedData)),
  articles: [],
};

export function toggleSaved(id, article) {
  const data = JSON.parse(localStorage.getItem("devlens_saved_data") || "{}");
  if (appState.savedIds.has(id)) {
    appState.savedIds.delete(id);
    delete data[id];
  } else {
    appState.savedIds.add(id);
    data[id] = article;
  }
  localStorage.setItem("devlens_saved_data", JSON.stringify(data));
}

export function getSavedArticles() {
  return Object.values(JSON.parse(localStorage.getItem("devlens_saved_data") || "{}"));
}

export function toggleCompare(id) {
  const idx = appState.compareIds.indexOf(id);
  if (idx !== -1) {
    appState.compareIds.splice(idx, 1);
  } else if (appState.compareIds.length < 2) {
    appState.compareIds.push(id);
  }
}
