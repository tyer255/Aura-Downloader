const url = "https://www.instagram.com/api/v1/media/by/code/3954939820216904951/";
async function test() {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'x-ig-app-id': '936619743392459',
    }
  });
  console.log(response.status);
  const text = await response.text();
  console.log(text.substring(0, 500));
}
test();
