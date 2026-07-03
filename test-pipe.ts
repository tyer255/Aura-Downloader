import http from "http";
import https from "https";
function fetchIt(targetUrl: string) {
  const parsedUrl = new URL(targetUrl);
  const client = parsedUrl.protocol === "https:" ? https : http;
  const requestOptions = {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Accept": "*/*"
    }
  };
  client.get(parsedUrl, requestOptions, (res) => {
    console.log(res.statusCode);
  });
}
// Get an actual scontent url from an embed.
async function getUrl() {
  const embedUrl = "https://www.instagram.com/p/DBk3aIay2jQ/embed/";
  const embedRes = await fetch(embedUrl);
  const html = await embedRes.text();
  const marker = '"contextJSON":"';
  const startIdx = html.indexOf(marker);
  const fromMarker = html.substring(startIdx + marker.length);
  let endIdx = 0;
  for (let i = 0; i < fromMarker.length; i++) {
    if (fromMarker[i] === '"' && fromMarker[i-1] !== '\\') {
      endIdx = i; break;
    }
  }
  const rawValue = fromMarker.substring(0, endIdx);
  const jsonStr = JSON.parse('"' + rawValue + '"');
  const parsed = JSON.parse(jsonStr);
  const displayUrl = parsed.gql_data.shortcode_media.display_url;
  console.log("Display URL:", displayUrl);
  fetchIt(displayUrl);
}
getUrl();
