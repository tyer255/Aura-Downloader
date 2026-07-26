const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// The incorrect line is around 1948:
// } else if (platform === 'snapchat') {
//    racePromises.push(extractGenericRapidAPI(trimmedUrl, "snapchat"));
//    console.log("Snapchat URL detected as profile/story, extracting with yt-dlp playlist.");

code = code.replace(/} else if \(platform === 'snapchat'\) \{\s*racePromises\.push\(extractGenericRapidAPI\(trimmedUrl, "snapchat"\)\);\s*console\.log\("Snapchat URL detected as profile\/story, extracting with yt-dlp playlist\."\);/g, "} else if (platform === 'snapchat') {\n           console.log(\"Snapchat URL detected as profile/story, extracting with yt-dlp playlist.\");");

fs.writeFileSync('server.ts', code);
console.log("Fixed profile snapchat");
