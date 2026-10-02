# I got tired of updating my projects on GitHub and my portfolio separately, so I built a script that syncs them automatically.

## Demo

![Demo: pushing to GitHub and the project appearing on the portfolio](./demo.gif)

*Replace `demo.gif` with your own recording, e.g. screen-record a push, then the card appearing.*

## How the it works

- A project shows **"In Progress"** if it's been pushed to within the last 7 days, and **"Live"** otherwise. This is based on each repo's `pushed_at` timestamp from GitHub.
- To change the 7-day window, edit `DAYS_UNTIL_LIVE` at the top of `index.html`.
- **Live link detection**: each card links to the repo's actual deployed URL (Vercel, Netlify, etc.) by reading GitHub's `homepage` field on the repo. If that's not set, it falls back to the repo's GitHub Pages URL.
- Only **starred** repos are pulled in, so you control exactly which projects show up by starring the ones you want featured.

## The Files

- **`projects.js`** — fetches your public repos from the GitHub API, pulls each one's README thumbnail, description, and languages, and shapes it all into a clean project object.
- **`index.html`** — renders those projects as cards on the page, shows a skeleton loading state while fetching, and opens a detail modal when a card is clicked.

## Setup (3 steps)
 
1. **Add both files** to your project — `project.js` and `index.jsx`, plus `npm install react lucide-react` if you don't already have them.
2. **Set your username and token.** In `project.js`, replace every `YOUR_USERNAME` with your GitHub username. For the token, generate one at GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens, scoped to **Public repositories (read-only)** — this raises your API rate limit from 60 requests/hour to 5,000/hour. Add it as an environment variable, `VITE_GITHUB_TOKEN` (or your bundler's equivalent prefix), never hardcoded in the file.
3. **Deploy** — if you're on Netlify or Vercel, add the token as an environment variable in their dashboard (Site settings → Environment variables), then deploy as usual.
