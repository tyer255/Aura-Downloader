const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const rapidGeneric = `
async function extractGenericRapidAPI(url: string, platform: string) {
    const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
    if (!rapidKey) return null;
    
    // We try a popular generic API if configured, otherwise return null
    // e.g. "social-download-all-in-one.p.rapidapi.com"
    const genericHost = process.env.RAPIDAPI_GENERIC_HOST;
    if (!genericHost) return null;

    try {
        console.log("Trying Generic RapidAPI for", platform, "...");
        const res = await fetch(\`https://\${genericHost}/download?url=\${encodeURIComponent(url)}\`, {
            headers: {
                "x-rapidapi-key": rapidKey,
                "x-rapidapi-host": genericHost
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.url) {
                return {
                    success: true,
                    title: data.title || \`\${platform} Video\`,
                    thumbnail: data.thumbnail || "",
                    url: data.url,
                    mediaType: "video",
                    source: "rapidapi"
                };
            }
        }
    } catch(e) {
        console.error("Generic RapidAPI error:", e.message);
    }
    return null;
}
`;

code = code.replace('async function extractInstagramRapidAPI', rapidGeneric + '\nasync function extractInstagramRapidAPI');

// Add to platforms
code = code.replace(/racePromises\.push\(extractTiktokTikwm\(trimmedUrl\)\);/g, 'racePromises.push(extractGenericRapidAPI(trimmedUrl, "tiktok"));\n            racePromises.push(extractTiktokTikwm(trimmedUrl));');
code = code.replace(/} else if \(platform === 'snapchat'\) \{/g, "} else if (platform === 'snapchat') {\n            racePromises.push(extractGenericRapidAPI(trimmedUrl, \"snapchat\"));");
code = code.replace(/racePromises\.push\(extractYoutubeBtch\(trimmedUrl\)\);/g, 'racePromises.push(extractGenericRapidAPI(trimmedUrl, "youtube"));\n            racePromises.push(extractYoutubeBtch(trimmedUrl));');
code = code.replace(/} else \{(\s*)racePromises\.push\(extractWithYtDlp\(trimmedUrl\)\);/g, "} else {$1racePromises.push(extractGenericRapidAPI(trimmedUrl, \"unknown\"));$1racePromises.push(extractWithYtDlp(trimmedUrl));");

fs.writeFileSync('server.ts', code);
console.log("Patched generic RapidAPI");
