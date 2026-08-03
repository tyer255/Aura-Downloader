const url = "https://www.instagram.com/graphql/query/?doc_id=24368985919464652&variables=%7B%22shortcode%22%3A%223954939820216904951%22%2C%22fetch_tagged_user_count%22%3Anull%2C%22hoisted_comment_id%22%3Anull%2C%22hoisted_reply_id%22%3Anull%7D";
async function test() {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  console.log(response.status);
  const text = await response.text();
  console.log(text.substring(0, 500));
}
test();
