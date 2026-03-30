# DevLens – Developer News Intelligence Dashboard

## Project Overview

**DevLens** is a modern, intuitive web application designed specifically for developers, software engineers, tech students, and professionals. It aggregates high-quality developer-focused content from two trusted sources: **DEV.to** and **Hacker News**.

In a world where developers are bombarded with scattered information across blogs, forums, and news sites, DevLens provides a clean, personalized dashboard to stay informed on the latest trends in programming, AI/ML, frontend/backend frameworks, DevOps, cybersecurity, open source, and career opportunities — without information overload.

### Why DevLens Matters (Real Value)
- Helps developers make better tech decisions and learn faster.
- Reduces time spent switching between tabs and sites.
- Supports daily habits like morning reading or staying ahead in a fast-moving industry.
- Particularly useful for students and professionals in growing tech hubs like Kigali, Rwanda.

This is **not** a gimmick — it solves a genuine productivity and learning problem faced by the developer community every day.

## Key Features & Intuitive User Experience

DevLens is built with a clean, dark-mode-first interface that feels professional and engaging:

- **Smart Lenses (Topic Tabs)**: Switch instantly between curated views:
  - All Developer Content
  - Frontend
  - Backend & APIs
  - AI / Machine Learning
  - DevOps & Cloud
  - Cybersecurity
  - Mobile Development
  - Career & Productivity
  - Open Source

- **Powerful Live Search**: Type in the search bar and results update instantly (debounced for smooth performance).

- **Advanced Filters**:
  - Source (DEV.to or Hacker News)
  - Date range (Today, This Week, This Month)
  - Multi-select tags (e.g., javascript, react, python, ai)

- **Sorting Options**:
  - Newest First
  - Most Popular / Highest Engagement
  - Relevance (for search results)

- **Beautiful Article Cards**:
  - Cover images (when available)
  - Title, excerpt, author/publisher
  - Tech tags
  - Estimated read time
  - Publish date and source indicator

- **Interactive Actions**:
  - Click any card to open a clean modal with full summary and "Read Original" button
  - **Save for Later** (persists using localStorage — your personal reading list)
  - **Side-by-Side Comparison Mode**: Select two articles to compare different perspectives on the same topic (e.g., a DEV.to tutorial vs. a Hacker News discussion)

- **Trending Tags Cloud**: Discover popular topics at a glance
- **Loading states, skeletons, and graceful error handling** (e.g., "One source unavailable — showing results from the other")

The UI is fully responsive and works great on desktop and mobile.

## Technologies & APIs Used

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **No backend required** for the core app (static hosting friendly)

### External APIs (Both free, no paid tier needed)

1. **DEV.to Public Articles API**
   - Base URL: `https://dev.to/api/articles`
   - Used for rich, community-written developer articles with cover images and tags
   - Supports filtering by tags (e.g., `?tag=javascript`), search, pagination
   - Official docs: https://developers.forem.com/api/v0 (DEV.to is powered by Forem)

2. **Hacker News Firebase Public API**
   - Base URLs:
     - `https://hacker-news.firebaseio.com/v0/topstories.json`
     - `https://hacker-news.firebaseio.com/v0/newstories.json`
     - `https://hacker-news.firebaseio.com/v0/item/{id}.json`
   - Used for high-signal tech discussions, Show HN, Ask HN, and trending links
   - Completely free and public (no API key required)
   - Official docs: https://github.com/HackerNews/API

**Data Normalization**: Articles from both sources are standardized into a common format for seamless filtering, sorting, and display.

**Credits**: 
- DEV.to API – https://dev.to
- Hacker News API – Y Combinator / Firebase

## How to Run Locally

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd devlens
   npx serve .
