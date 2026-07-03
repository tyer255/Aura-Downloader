import https from "https";

async function getUrl() {
  const embedUrl = "https://www.instagram.com/p/DBk3aIay2jQ/embed/";
  const embedRes = await fetch(embedUrl);
  const html = await embedRes.text();
  const match = html.match(/"display_url":"([^"]+)"/);
  if (match) {
    const displayUrl = match[1].replace(/\\u0026/g, '&').replace(/\\/g, '');
    console.log("Display URL:", displayUrl);
    
    const parsedUrl = new URL(displayUrl);
    const client = parsedUrl.protocol === "https:" ? https : require("http");
    const requestOptions = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept": "*/*"
      }
    };
    client.get(parsedUrl, requestOptions, (res: any) => {
      console.log(res.statusCode);
    });
  }
}
getUrl();
