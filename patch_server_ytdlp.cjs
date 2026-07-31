const fs = require('fs');

let serverCode = fs.readFileSync('server.ts', 'utf8');

const oldYtdlpOptions = `    let options: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      noPlaylist: !isPlaylist,
      youtubeSkipDashManifest: true,
      youtubeSkipHlsManifest: true,
      noCheckFormats: true,
      checkFormats: "no"
    };`;

const newYtdlpOptions = `    let options: any = {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      noPlaylist: !isPlaylist,
      noCheckFormats: true,
      extractorArgs: "youtube:player_client=android"
    };`;

if (serverCode.includes(oldYtdlpOptions)) {
    serverCode = serverCode.replace(oldYtdlpOptions, newYtdlpOptions);
    console.log("Patched yt-dlp options successfully!");
} else {
    console.log("Could not find yt-dlp options in server.ts");
}

fs.writeFileSync('server.ts', serverCode);
