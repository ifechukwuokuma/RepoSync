// netlify/functions/projects_netlify.js
/* global process, Buffer */

// This file runs on Netlify's server, never in the visitor's browser.
// That is why the GitHub token is safe here.

// Change this to your GitHub username
const USERNAME = "YOUR_USERNAME";

// The README is the description: take its text from the very start
// and clean out the markdown so it reads as plain text.
const getReadmeDescription = (markdown) => {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // remove images
    .replace(/<[^>]+>/g, "") // remove html tags but keep the text inside
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [text](url) becomes text
    .replace(/^#+\s*/gm, "") // remove heading marks but keep the text
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ") // collapse line breaks into spaces
    .trim();
};

export default async () => {
  // Optional. Set GITHUB_TOKEN in your Netlify environment variables.
  // No token: public repos only. With a token: private repos too.
  const token = process.env.GITHUB_TOKEN;

  const headers = {
    Accept: "application/vnd.github+json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  // /user/repos is the only endpoint that includes private repos,
  // and it only works with a token. Without one, we use the public list.
  const listUrl = token
    ? "https://api.github.com/user/repos?affiliation=owner&per_page=100&sort=pushed"
    : `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed`;

  try {
    const response = await fetch(listUrl, { headers });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();

    // Starring a repo is the "show this one" switch.
    // Only starred repos appear, public or private.
    const starredRepos = data.filter((repo) => repo.stargazers_count > 0);

    const projects = await Promise.all(
      starredRepos.map(async (repo) => {
        let description = repo.description || "";
        let thumbnail = "";
        let languages = [];

        // Read the README for the thumbnail and the description
        try {
          const readmeRes = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/readme`,
            { headers }
          );

          if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            const decoded = Buffer.from(readmeData.content, "base64").toString("utf-8");

            // The first image in the README becomes the thumbnail
            const imgMatch = decoded.match(/!\[.*?\]\(([^)]+)\)/);
            if (imgMatch && imgMatch[1]) {
              let imgUrl = imgMatch[1].trim();

              if (imgUrl.startsWith("http")) {
                thumbnail = imgUrl;
              } else if (!repo.private) {
                // Relative images only load in a browser for public repos
                thumbnail = `https://raw.githubusercontent.com/${repo.owner.login}/${repo.name}/${repo.default_branch}/${imgUrl.replace(/^\.?\//, "")}`;
              }
            }

            // README text first, then the GitHub About text, then a default
            description = getReadmeDescription(decoded) || description || "No description provided.";

            // Keep descriptions card sized. Long text is cut and ends with "..."
            const maxLength = 188;
            if (description.length > maxLength) {
              description = description.slice(0, maxLength).trimEnd() + "...";
            }
          }
        } catch (err) {
          console.error(`Error fetching README for ${repo.name}:`, err);
        }

        // Read the languages used in the repo
        try {
          const langsRes = await fetch(
            `https://api.github.com/repos/${repo.owner.login}/${repo.name}/languages`,
            { headers }
          );
          if (langsRes.ok) {
            const langsData = await langsRes.json();
            languages = Object.keys(langsData);
          }
        } catch (err) {
          console.error(`Error fetching languages for ${repo.name}:`, err);
        }

        // The shape of each project your frontend receives.
        // "status" is the last push date. Compare it to today to show
        // "In Progress" or "Live" on your cards.
        return {
          id: repo.id,
          name: repo.name,
          description,
          stars: repo.stargazers_count,
          branch: repo.default_branch,
          repoUrl: repo.html_url,
          liveUrl: repo.homepage || `https://${repo.owner.login}.github.io/${repo.name}`,
          thumbnail: thumbnail || "/fallback-thumbnail.png",
          status: repo.pushed_at,
          languages,
          private: repo.private,
        };
      })
    );

    // Cached for 5 minutes so visitors don't use up GitHub's rate limit
    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error fetching GitHub projects:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch projects" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
