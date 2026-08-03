import fetch from 'node-fetch';

async function testRapidHosts(shortcode) {
  const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
  console.log("Testing RapidAPI hosts with key:", rapidKey?.substring(0, 10) + "...");

  const postUrl = `https://www.instagram.com/p/${shortcode}/`;

  const hosts = [
    {
      host: "instagram-scraper-api2.p.rapidapi.com",
      url: `https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${encodeURIComponent(shortcode)}`
    },
    {
      host: "instagram120.p.rapidapi.com",
      url: "https://instagram120.p.rapidapi.com/api/instagram/links",
      method: "POST",
      body: JSON.stringify({ url: postUrl })
    },
    {
      host: "instagram-downloader-download-instagram-videos-photos.p.rapidapi.com",
      url: `https://instagram-downloader-download-instagram-videos-photos.p.rapidapi.com/index?url=${encodeURIComponent(postUrl)}`
    },
    {
      host: "instagram-bulk-scraper-latest.p.rapidapi.com",
      url: `https://instagram-bulk-scraper-latest.p.rapidapi.com/media_info_from_url?url=${encodeURIComponent(postUrl)}`
    },
    {
      host: "instagram-media-downloader.p.rapidapi.com",
      url: `https://instagram-media-downloader.p.rapidapi.com/rapid/post.php?url=${encodeURIComponent(postUrl)}`
    },
    {
      host: "instagram-post-downloader.p.rapidapi.com",
      url: `https://instagram-post-downloader.p.rapidapi.com/request?url=${encodeURIComponent(postUrl)}`
    },
    {
      host: "social-media-video-downloader.p.rapidapi.com",
      url: `https://social-media-video-downloader.p.rapidapi.com/smvd/get/instagram?url=${encodeURIComponent(postUrl)}`
    }
  ];

  for (const item of hosts) {
    try {
      console.log(`\nTesting host: ${item.host}`);
      const headers = {
        "x-rapidapi-key": rapidKey,
        "x-rapidapi-host": item.host,
        "Content-Type": "application/json"
      };
      const opts = {
        method: item.method || "GET",
        headers,
        body: item.body
      };
      const res = await fetch(item.url, opts);
      console.log(`Host ${item.host} status:`, res.status);
      if (res.ok) {
        const text = await res.text();
        console.log(`Host ${item.host} response len:`, text.length, "snippet:", text.substring(0, 300));
      } else {
        const text = await res.text();
        console.log(`Host ${item.host} error response:`, text.substring(0, 200));
      }
    } catch(e) {
      console.log(`Host ${item.host} error:`, e.message);
    }
  }
}

testRapidHosts("C3x-Z2_S0gY");
