async function run() {
    const shortcode = "DB1D7rwyF9H";
    const graphqlUrl = `https://www.instagram.com/graphql/query/?doc_id=24368985919464652&variables=${encodeURIComponent(`{"shortcode":"${shortcode}","fetch_tagged_user_count":null,"hoisted_comment_id":null,"hoisted_reply_id":null}`)}`;
    const response = await fetch(graphqlUrl, {
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
    const text = await response.text();
    console.log(text.substring(0, 500));
}
run();
