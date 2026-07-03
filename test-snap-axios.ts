import axios from 'axios';
import qs from 'qs';
async function test() {
  let data = qs.stringify({
    'url': 'https://www.instagram.com/reel/C89U8lSye0D/',
    'action': 'post',
    'lang': 'en'
  });

  let config = {
    method: 'post',
    url: 'https://snapinsta.app/action2.php',
    headers: {
      'authority': 'snapinsta.app',
      'accept': '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://snapinsta.app',
      'referer': 'https://snapinsta.app/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    data : data,
    timeout: 5000
  };

  try {
    const response = await axios.request(config);
    console.log(response.status, response.data);
  } catch(e) { console.log(e.message); }
}
test();
