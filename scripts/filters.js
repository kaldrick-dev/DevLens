const LENS_KEYWORDS = {
  frontend: ["javascript", "typescript", "react", "vue", "angular", "css", "html", "webdev", "frontend", "svelte", "nextjs", "tailwind", "webpack", "vite"],
  backend: ["node", "nodejs", "python", "java", "go", "rust", "api", "database", "sql", "backend", "server", "express", "django", "fastapi", "microservice", "graphql", "rest"],
  ai: ["ai", "ml", "machine learning", "deep learning", "llm", "gpt", "neural", "openai", "nlp", "datascience", "pytorch", "tensorflow", "generative", "embedding", "langchain"],
  devops: ["devops", "docker", "kubernetes", "k8s", "ci", "cd", "aws", "cloud", "terraform", "linux", "infrastructure", "deployment", "github actions", "ansible", "monitoring"],
  security: ["security", "cybersecurity", "pentest", "vulnerability", "auth", "oauth", "encryption", "cve", "hacking", "infosec", "zero trust", "owasp", "exploit"],
  mobile: ["ios", "android", "flutter", "react native", "swift", "kotlin", "mobile", "xcode"],
  career: ["career", "productivity", "interview", "job", "resume", "soft skills", "teamwork", "management", "hiring", "salary", "remote work"],
  opensource: ["open source", "opensource", "github", "contribution", "community", "license", "hacktoberfest"],
};

function matchesLens(article, lens) {
  if (lens === "all") return true;
  const keywords = LENS_KEYWORDS[lens];
  if (!keywords) return true;
  const haystack = [
    article.title,
    article.excerpt,
    ...(article.tags || []),
  ].join(" ").toLowerCase();
  return keywords.some((kw) => haystack.includes(kw));
}

export function applyFilters(articles, state) {
  let out = [...articles];

  if (state.source !== "all") {
    out = out.filter((a) => a.source === state.source);
  }

  if (state.lens !== "all") {
    out = out.filter((a) => matchesLens(a, state.lens));
  }

  if (state.query) {
    const q = state.query.toLowerCase();
    out = out.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        (a.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }

  if (state.sort === "popular") {
    out.sort((a, b) => b.score - a.score);
  } else if (state.sort === "relevance" && state.query) {
    // rank by number of query-term matches in title (more = higher)
    const q = state.query.toLowerCase();
    out.sort((a, b) => {
      const scoreA = (a.title.toLowerCase().split(q).length - 1) * 2 + (a.excerpt.toLowerCase().split(q).length - 1);
      const scoreB = (b.title.toLowerCase().split(q).length - 1) * 2 + (b.excerpt.toLowerCase().split(q).length - 1);
      return scoreB - scoreA;
    });
  } else {
    out.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  return out;
}
