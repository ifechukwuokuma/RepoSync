// src/data/projectData.js

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

const githubHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
};

export const fetchGitHubProjects = async () => {
  try {
    const response = await fetch("https://api.github.com/users/ifechukwuokuma/repos", {
      headers: githubHeaders,
    });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const data = await response.json();

    // Filter only starred repos
    const starredRepos = data.filter(repo => repo.stargazers_count > 0);

    const projects = await Promise.all(
      starredRepos.map(async (repo) => {
        let description = repo.description || "";
        let thumbnail = "";
        let languages = [];

        try {
          // Fetch README
          const readmeRes = await fetch(
            `https://api.github.com/repos/ifechukwuokuma/${repo.name}/readme`,
            { headers: githubHeaders }
          );

          if (readmeRes.ok) {
            const readmeData = await readmeRes.json();
            const decoded = decodeURIComponent(escape(atob(readmeData.content)));

            // Extract the first image from the README (Markdown format)
            const imgMatch = decoded.match(/!\[.*?\]\(([^)]+)\)/);
            if (imgMatch && imgMatch[1]) {
              let imgUrl = imgMatch[1].trim();

              if (!imgUrl.startsWith("http")) {
                imgUrl = `https://raw.githubusercontent.com/ifechukwuokuma/${repo.name}/${repo.default_branch}/${imgUrl.replace(/^\.?\//, "")}`;
              }

              thumbnail = imgUrl;
            }

            // Description fallback
            if (!description) {
              const textLines = decoded
                .split("\n")
                .map(line => line.trim())
                .filter(line => line && !line.startsWith("#") && !line.startsWith("!") && !line.startsWith("[") && !line.startsWith("<"))
                .map(line => line.replace(/[*_`]/g, ""));

              description = textLines.join(" ") || "No description provided.";
            }

            // Truncate the description
            const maxLength = 188;
            if (description.length > maxLength) {
              description = description.slice(0, maxLength);
            }
          }
        } catch (err) {
          console.error(`Error fetching README for ${repo.name}:`, err);
        }

        // Fetch languages
        try {
          const langsRes = await fetch(
            `https://api.github.com/repos/ifechukwuokuma/${repo.name}/languages`,
            { headers: githubHeaders }
          );
          if (langsRes.ok) {
            const langsData = await langsRes.json();
            languages = Object.keys(langsData);
          }
        } catch (err) {
          console.error(`Error fetching languages for ${repo.name}:`, err);
        }

        return {
          id: repo.id,
          name: repo.name,
          description,
          stars: repo.stargazers_count,
          branch: repo.default_branch,
          repoUrl: repo.html_url,
          liveUrl: repo.homepage || `https://ifechukwuokuma.github.io/${repo.name}`,
          thumbnail: thumbnail || "/fallback-thumbnail.png",
          status: repo.pushed_at,
          languages,
        };
      })
    );

    return projects;
  } catch (error) {
    console.error("Error fetching GitHub projects:", error);
    return [];
  }
};
