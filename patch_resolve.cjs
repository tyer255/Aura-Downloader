const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /const searchPromises = queries\.map\([\s\S]*?if \(!htmlResults\) continue;\s*/g; // not quite right

const startString = `  // Fetch all queries concurrently to drastically reduce extraction time`;
const endString = `  if (candidates.length > 0) {
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].id;
  }`;

if (code.includes(startString) && code.includes(endString)) {
   let startIndex = code.indexOf(startString);
   let endIndex = code.indexOf(endString) + endString.length;
   
   let newLogic = `  // Fetch queries and resolve early if a highly confident match is found
  const videoId = await new Promise<string | null>((resolve) => {
      let completed = 0;
      let resolved = false;

      function checkResolve() {
          if (resolved) return;
          if (candidates.length > 0) {
              candidates.sort((a, b) => b.score - a.score);
              // Strong candidate (score >= 400 means Official Channel or ISRC)
              if (candidates[0].score >= 400 || completed === queries.length) {
                  resolved = true;
                  resolve(candidates[0].id);
              }
          } else if (completed === queries.length) {
              resolved = true;
              resolve(null);
          }
      }

      if (queries.length === 0) {
          resolve(null);
          return;
      }

      queries.forEach(async (q) => {
          try {
              const res = await axios.get(\`https://www.youtube.com/results?search_query=\${encodeURIComponent(q)}\`, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                  timeout: 2500
              });
              
              if (resolved) return;
              
              const searchHtml = res.data;
              const jsonMatch = searchHtml.match(/var ytInitialData = ({.*?});<\\/script>/);
              if (jsonMatch) {
                  const data = JSON.parse(jsonMatch[1]);
                  const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
                  for (let c of contents) {
                      const items = c.itemSectionRenderer?.contents || [];
                      for (let item of items) {
                          if (item.videoRenderer) {
                              const v = item.videoRenderer;
                              if (!v.videoId || seenIds.has(v.videoId)) continue;
                              seenIds.add(v.videoId);

                              const title = v.title?.runs?.[0]?.text || "";
                              const channel = v.ownerText?.runs?.[0]?.text || "";
                              const durSec = parseDuration(v.lengthText?.simpleText);

                              const titleLower = title.toLowerCase();
                              const channelLower = channel.toLowerCase();

                              // Rejection Check 1: Banned Keywords
                              let hasBanned = false;
                              for (const kw of activeBannedKeywords) {
                                  if (titleLower.includes(kw) || channelLower.includes(kw)) {
                                      hasBanned = true;
                                      break;
                                  }
                              }
                              if (hasBanned) continue;

                              // Rejection Check 2: Artist match
                              const isIsrcMatch = isrc && (titleLower.includes(isrc.toLowerCase()) || channelLower.includes(isrc.toLowerCase()));
                              const artistMatched = allArtists.some(artist => 
                                  artist && (titleLower.includes(artist.toLowerCase()) || channelLower.includes(artist.toLowerCase()))
                              );
                              if (!artistMatched && !isIsrcMatch && allArtists.length > 0) continue;

                              // Rejection Check 3: Duration match (max 6s delta)
                              const maxAllowedDelta = 6;
                              const durationDelta = Math.abs(durSec - targetDurationSec);
                              if (targetDurationSec > 0 && durationDelta > maxAllowedDelta) continue;

                              // Candidate Passed! Calculate preference score
                              let score = 0;
                              if (isIsrcMatch) score += 1000;

                              const isOfficialArtistChannel = allArtists.some(a => a && channelLower.includes(a.toLowerCase()));
                              if (isOfficialArtistChannel && !channelLower.includes("topic")) score += 400;

                              if (titleLower.includes("official audio") || titleLower.includes("audio")) score += 300;
                              if (titleLower.includes("official music video") || titleLower.includes("official video")) score += 200;
                              if (channelLower.includes("- topic") || channelLower.endsWith("topic")) score += 100;

                              score += (maxAllowedDelta - durationDelta) * 20;
                              if (durationDelta <= 3) score += 50;

                              candidates.push({ id: v.videoId, title, channel, durSec, score, durationDelta });
                          }
                      }
                  }
              }
          } catch(e) {}
          completed++;
          checkResolve();
      });
  });

  if (videoId) return videoId;
`;

   code = code.substring(0, startIndex) + newLogic + code.substring(endIndex);
   fs.writeFileSync('server.ts', code);
   console.log("Patched resolveSpotifyTrackToYouTube for early resolution!");
} else {
   console.log("Could not find targets");
}
