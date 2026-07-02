import vreden from '@vreden/youtube_scraper';

async function test() {
  const url = 'https://www.instagram.com/reel/C-R2sQhS9oH/';
  const rapidApi = await fetch(`https://instagram-scraper-api2.p.rapidapi.com/v1/post_info?code_or_id_or_url=${encodeURIComponent(url)}&include_insights=true`, {
          headers: {
            'x-rapidapi-host': 'instagram-scraper-api2.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY || "ebf06f52ccmsha7d530ee2858da8p1136b8jsnb295ff68f184"
          }
  }).then(res => res.json());
  console.log("RapidAPI response:", rapidApi);
  if (rapidApi && rapidApi.data && rapidApi.data.video_url) {
     const https = await import('https');
     const req = https.get(rapidApi.data.video_url, {
       headers: {
         "User-Agent": "Mozilla/5.0",
         "Accept": "*/*"
       }
     }, (res) => {
       console.log("IG Proxy Status:", res.statusCode);
     });
  }
}
test();
