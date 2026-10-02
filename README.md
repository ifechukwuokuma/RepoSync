# GitHub Project Sync

Automatically pulls your starred GitHub repos and displays them on your portfolio as live project cards, no manual updates needed.

## Demo

![Demo: pushing to GitHub and the project appearing on the portfolio](./demo.gif)

*Replace `demo.gif` with your own recording, e.g. screen-record a push, then the card appearing.*

## The Files

- **`projects.js`** — fetches your public repos from the GitHub API, pulls each one's README thumbnail, description, and languages, and shapes it all into a clean project object.
- **`index.html`** — renders those projects as cards on the page, shows a skeleton loading state while fetching, and opens a detail modal when a card is clicked.

## Setup (3 steps)

1. **Add both files** to your project — `projects.js` and `index.html` in the same folder.
2. **Set your username and token** at the top of `index.html`:
   ```js
   const GITHUB_USERNAME = "your-username-here";
   const GITHUB_TOKEN = "your-fine-grained-token-here";
   ```
   Generate a token at GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens, scoped to **Public repositories (read-only)**. This raises your API rate limit from 60 requests/hour to 5,000/hour.
3. **Deploy** — drag the folder into Netlify, or connect the repo for auto-deploys. No build step, no `npm install`.

## How the status works

- A project shows **"In Progress"** if it's been pushed to within the last 7 days, and **"Live"** otherwise. This is based on each repo's `pushed_at` timestamp from GitHub.
- To change the 7-day window, edit `DAYS_UNTIL_LIVE` at the top of `index.html`.
- **Live link detection**: each card links to the repo's actual deployed URL (Vercel, Netlify, etc.) by reading GitHub's `homepage` field on the repo. If that's not set, it falls back to the repo's GitHub Pages URL.
- Only **starred** repos are pulled in, so you control exactly which projects show up by starring the ones you want featured.
