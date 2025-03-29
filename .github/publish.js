const fetch = require("node-fetch");

const version = process.env.RELEASE_VERSION; // e.g., "0.0.2"
const [owner, repo] = process.env.REPO.split('/');

(async () => {
  const response = await fetch("https://api.foundryvtt.com/_api/packages/release_version/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `fvttp_${process.env.FOUNDRY_API_TOKEN}`
    },
    body: JSON.stringify({
      id: "bowenarrows-utils", // Your actual Foundry module ID
      "dry-run": true,
      release: {
        version: version,
        manifest: `https://github.com/${owner}/${repo}/releases/download/${version}/module.json`,
        notes: `https://github.com/${owner}/${repo}/blob/main/CHANGELOG.md`,
        compatibility: {
          minimum: "12",
          verified: "12",
          maximum: ""
        }
      }
    })
  });

  const data = await response.json();
  console.log("Release response:", data);
})();
