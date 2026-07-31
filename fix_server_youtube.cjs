const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

// 1. Remove extractorArgs: "youtube:player_client=android"
const oldYtdlpOptions = `    let options: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      noPlaylist: !isPlaylist,
      noCheckFormats: true,
      extractorArgs: "youtube:player_client=android"
    };`;

const newYtdlpOptions = `    let options: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      noPlaylist: !isPlaylist,
      noCheckFormats: true
    };`;

if (serverCode.includes(oldYtdlpOptions)) {
    serverCode = serverCode.replace(oldYtdlpOptions, newYtdlpOptions);
    console.log("1. Removed android player client restriction in yt-dlp!");
} else {
    console.log("1. Old yt-dlp options string not matched exactly, checking...");
}

// 2. Enhance YouTube thumbnail handling in extractWithYtDlp
const oldReturn = `    return {
      success: true,
      title: data.title || "Extracted Video",
      url: mediaUrl,
      thumbnail: data.thumbnail || "",
      mediaType: "video",
      source: "yt-dlp",
      qualities: qualities.length > 0 ? qualities : getFallbackQualities(mediaUrl, "video")
    };`;

const newReturn = `    let videoId = "";
    const ytMatch = url.match(/(?:youtube\\.com\\/(?:[^\\/]+\\/.+\\/|(?:v|e(?:mbed)?|shorts)\\/|.*[?&]v=)|youtu\\.be\\/)([^"&?\\/\\s]{11})/i);
    if (ytMatch) {
      videoId = ytMatch[1];
    }
    const finalThumbnail = videoId ? \`https://i.ytimg.com/vi/\${videoId}/maxresdefault.jpg\` : (data.thumbnail || "");

    return {
      success: true,
      title: data.title || "Extracted Video",
      url: mediaUrl,
      thumbnail: finalThumbnail,
      mediaType: "video",
      source: "yt-dlp",
      qualities: qualities.length > 0 ? qualities : getFallbackQualities(mediaUrl, "video")
    };`;

if (serverCode.includes(oldReturn)) {
    serverCode = serverCode.replace(oldReturn, newReturn);
    console.log("2. Enhanced thumbnail extraction in extractWithYtDlp!");
} else {
    console.log("2. Could not find old return statement in extractWithYtDlp.");
}

// 3. Prioritize extractWithYtDlp for YouTube in /api/download
const oldYtRace = `        } else if (platform === 'youtube') {
            racePromises.push(extractYoutubeBtch(trimmedUrl));
            racePromises.push(extractWithVreden(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));`;

const newYtRace = `        } else if (platform === 'youtube') {
            console.log("Extracting YouTube video with yt-dlp...");
            const ytResult = await extractWithYtDlp(trimmedUrl);
            if (ytResult && ytResult.success && ytResult.qualities && ytResult.qualities.length > 0) {
                return res.json(ytResult);
            }
            console.log("yt-dlp failed, falling back to racing secondary extractors...");
            racePromises.push(extractYoutubeBtch(trimmedUrl));
            racePromises.push(extractWithVreden(trimmedUrl));`;

if (serverCode.includes(oldYtRace)) {
    serverCode = serverCode.replace(oldYtRace, newYtRace);
    console.log("3. Prioritized yt-dlp for YouTube in /api/download!");
} else {
    console.log("3. Could not find old YouTube race code.");
}

fs.writeFileSync('server.ts', serverCode);
