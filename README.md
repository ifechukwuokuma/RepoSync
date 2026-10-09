# I got tired of updating my projects on GitHub and my portfolio separately, so I built a script that automatically syncs them,  keeping everything up to date without the extra manual work.

## Demo

![Demo: pushing to GitHub and the project appearing on the portfolio](./demo.gif)

*Replace `demo.gif` with your own recording, e.g. screen-record a push, then the card appearing.*

## How it works

- Your portfolio asks a **Netlify Function** for your projects. The function talks to GitHub, so your token stays on the server and never reaches the browser.
- Only **starred** repos are pulled in. Star a repo to show it, unstar it to hide it. This works for public and private repos.
- Each project's description is the **README text, from the first line**, cut at 188 characters. If a README has no text, it falls back to the repo's GitHub "About" description.
- The first image in the README becomes the thumbnail, and the repo's languages are listed.
- **Live link detection**: each project links to the repo's `homepage` field on GitHub (Vercel, Netlify, etc.). If that's empty, it falls back to the repo's GitHub Pages URL.
- **Status**: the function returns each repo's last push date as `status`. Compare it to today on your cards. A project is "In Progress" if it was pushed to in the last 7 days, and "Live" otherwise. Note that "Live" means "not touched recently". It does not check that the project is deployed.

```javascript
const DAYS_UNTIL_LIVE = 7;
const daysSincePush = (Date.now() - new Date(project.status)) / (1000 * 60 * 60 * 24);
const label = daysSincePush < DAYS_UNTIL_LIVE ? "In Progress" : "Live";
```

## The Files

- **`netlify/functions/projects_netlify.js`**: runs on Netlify's server. Fetches your repos from the GitHub API, reads each README and its languages, and returns a clean list of projects. This is the only file that touches a token.
- **`projects.js`**: runs in the browser. Calls the function and gives you the project list. It never talks to GitHub and never sees a token.

You build the cards yourself. The function returns an array of projects with `id`, `name`, `description`, `stars`, `branch`, `repoUrl`, `liveUrl`, `thumbnail`, `status`, `languages` and `private`.

## Setup

This is built for **Netlify**, since it uses Netlify Functions.

1. **Add the two files** to your project, keeping the folder path `netlify/functions/` for the function.
2. **Set your username.** In `projects_netlify.js`, change `YOUR_USERNAME` to your GitHub username.
3. **Call it from your site.** Use `fetchGitHubProjects()` from `projects.js` wherever you render your projects.
4. **Deploy to Netlify.** It finds the `netlify/functions` folder automatically.

That's enough to show your **public** starred repos. No token needed.

## Showing private repos (optional)

1. On GitHub, go to Settings, Developer settings, Personal access tokens, Fine-grained tokens, and generate a new token.
2. Set **Repository access** to "All repositories".
3. Under **Repository permissions**, set **Contents** to read-only. Metadata is added automatically. Leave everything else, including Administration, on "No access". Leave all Account permissions on "No access".
4. Set an expiration date.
5. In Netlify, go to Site configuration, Environment variables, and add `GITHUB_TOKEN` with your token. Tick "Contains secret values". **Do not** add a `VITE_` or `NEXT_PUBLIC_` prefix, because those prefixes put the value in your public website code.
6. Redeploy, then star the private repos you want to show.

**Know before you do this:** the code of a private repo stays private, but its **name, description and thumbnail become public** on your portfolio. Only star private repos you are happy to have shown. Relative README images from private repos can't load in a browser, so those cards use the fallback thumbnail (`/fallback-thumbnail.png`, add one to your public folder).

## Testing locally

Your normal dev server can't run Netlify Functions. Use:

```
npx netlify dev
```

Then open the link it prints (usually `http://localhost:8888`). Locally you'll only see public repos, unless you set up the token for local development.

## Rate limits

Without a token, GitHub allows 60 requests an hour, and each refresh of the list costs 1 request plus 2 per starred repo. The function caches its answer for 5 minutes, which keeps this manageable. If cards start disappearing, add a token, which raises the limit to 5,000 requests an hour.
