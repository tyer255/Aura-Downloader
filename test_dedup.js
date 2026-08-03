const urls = [
  "https://d.rapidcdn.app/v2?token=abc",
  "https://d.rapidcdn.app/v2?token=def",
  "https://scontent-vie1-1.cdninstagram.com/v/t51.2885-15/123_n.jpg?_nc_cat=100&ig_cache_key=xyz",
  "https://scontent-vie1-1.cdninstagram.com/v/t51.2885-15/123_n.jpg?_nc_cat=100&ig_cache_key=abc"
];

for (const cleanUrl of urls) {
  let urlKey = cleanUrl;
  try {
    const parsedUrl = new URL(cleanUrl);
    if (parsedUrl.hostname.includes('cdninstagram.com') || parsedUrl.hostname.includes('fbcdn.net') || parsedUrl.hostname.includes('instagram.f')) {
      urlKey = parsedUrl.origin + parsedUrl.pathname;
    }
  } catch (e) {
    urlKey = cleanUrl.split('?')[0].trim();
  }
  console.log(urlKey);
}
