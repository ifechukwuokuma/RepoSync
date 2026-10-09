// projects.js
// Runs in the browser. It never talks to GitHub directly and never
// touches a token. It only asks the Netlify Function for the projects.

export const fetchGitHubProjects = async () => {
  try {
    const response = await fetch("/.netlify/functions/projects_netlify");
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching GitHub projects:", error);
    return [];
  }
};
