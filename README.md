# DevLens – Developer News Intelligence Dashboard

**Live Demo**: [kaldrick.tech](https://youtu.be/f5ijaJMQOWE)

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
   ```

Or with Python:
   ```bash
   python3 -m http.server 8080
   ```

> Do not open `index.html` directly as a `file://` URL — ES modules are blocked by the browser in that context.

---

## Deployment & Load Balancer Setup

This section documents how DevLens is deployed across two web servers with an Nginx load balancer distributing traffic between them.

### Architecture Overview

```
                        ┌─────────────┐
         Internet ──▶   │ Load Balancer│  (lb-server)
                        │  Nginx :80  │
                        └──────┬──────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
      ┌─────────────────┐             ┌─────────────────┐
      │   Web Server 1  │             │   Web Server 2  │
      │  Nginx :80      │             │  Nginx :80      │
      │  (web-01)       │             │  (web-02)       │
      └─────────────────┘             └─────────────────┘
```

Three servers are involved:
| Role | Hostname | Description |
|---|---|---|
| Load Balancer | `lb-01` | Receives all incoming requests, distributes to web servers |
| Web Server 1 | `web-01` | Serves the static DevLens files |
| Web Server 2 | `web-02` | Serves the static DevLens files (replica) |

---

### Step 1 — Clone the Repository on Each Web Server

SSH into **web-01** and **web-02** separately and run:

```bash
git clone <your-repo-url> /var/www/devlens
```

Verify the files are in place:

```bash
ls /var/www/devlens
# index.html  styles/  scripts/  assets/
```

---

### Step 2 — Configure Nginx on Each Web Server

On both **web-01** and **web-02**, create an Nginx site configuration:

```bash
sudo nano /etc/nginx/sites-available/devlens
```

Paste the following:

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/devlens;
    index index.html;

    # Serve static files directly
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(css|js|png|ico|jpg|jpeg|svg|webp)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Identify which server handled the request (useful for LB testing)
    add_header X-Served-By $hostname;
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/devlens /etc/nginx/sites-enabled/devlens
sudo nginx -t
sudo systemctl reload nginx
```

Verify each server responds on its own before touching the load balancer:

```bash
curl -I http://<web-01-ip>/
curl -I http://<web-02-ip>/
# Both should return: HTTP/1.1 200 OK
```

---

### Step 3 — Configure the Load Balancer

SSH into **lb-01** and create the Nginx load balancer configuration:

```bash
sudo nano /etc/nginx/sites-available/devlens-lb
```

Paste the following:

```nginx
upstream devlens_pool {
    # Round-robin by default — each request goes to the next server in turn
    server <web-01-ip>;
    server <web-02-ip>;

    # Optional: enable keepalive connections to backends
    keepalive 32;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://devlens_pool;

        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Forward real client info to backend servers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Timeouts
        proxy_connect_timeout 5s;
        proxy_read_timeout 30s;
    }
}
```

Replace `<web-01-ip>` and `<web-02-ip>` with the private IP addresses of your web servers.

Enable the config and reload:

```bash
sudo ln -s /etc/nginx/sites-available/devlens-lb /etc/nginx/sites-enabled/devlens-lb

# Remove the default site if it conflicts on port 80
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 4 — Load Balancing Algorithm

The configuration above uses **round-robin** (Nginx default), which cycles requests evenly across both servers. Two alternative algorithms are available if needed:

**Least connections** — sends each new request to the server with the fewest active connections:
```nginx
upstream devlens_pool {
    least_conn;
    server <web-01-ip>;
    server <web-02-ip>;
}
```

**IP hash** — pins each client IP to the same backend (useful if session state matters):
```nginx
upstream devlens_pool {
    ip_hash;
    server <web-01-ip>;
    server <web-02-ip>;
}
```

DevLens has no server-side session state (all state is in the browser via localStorage), so round-robin is the correct choice here.

---

### Step 5 — Testing the Load Balancer

#### Verify the app loads through the load balancer

Open a browser and navigate to `http://<lb-01-ip>/`. DevLens should load and fetch articles normally.

#### Verify traffic is being distributed between both servers

The `X-Served-By` header added in Step 2 identifies which backend handled each request. Send several requests and observe the header alternating:

```bash
for i in {1..6}; do
  curl -sI http://<lb-01-ip>/ | grep X-Served-By
done
```

Expected output (alternating between servers):
```
X-Served-By: web-01
X-Served-By: web-02
X-Served-By: web-01
X-Served-By: web-02
X-Served-By: web-01
X-Served-By: web-02
```

#### Test failover — simulate one server going down

Stop Nginx on **web-01**:

```bash
# On web-01:
sudo systemctl stop nginx
```

Then send requests through the load balancer:

```bash
for i in {1..4}; do
  curl -sI http://<lb-01-ip>/ | grep X-Served-By
done
```

All responses should now show `X-Served-By: web-02` — the load balancer automatically stops routing to the failed server.

Bring **web-01** back up and confirm traffic resumes:

```bash
# On web-01:
sudo systemctl start nginx
```

#### Test the application end-to-end through the load balancer

1. Open `http://<lb-01-ip>/` in a browser
2. Confirm articles load from DEV.to and Hacker News
3. Test search — type a query and verify live results appear
4. Apply a lens filter (e.g. "AI / ML") and confirm articles are filtered
5. Open an article modal, save an article, and verify the save persists on refresh
6. Select two articles and open the Side-by-Side Comparison modal
7. Open DevTools → Network tab → confirm all assets (CSS, JS, images) return `200 OK`

---

### Updating the Application

To deploy a new version, pull the latest code on both web servers:

```bash
# Run on web-01 and web-02:
cd /var/www/devlens
git pull origin main
```

No server restart is required — Nginx serves files directly from disk.
