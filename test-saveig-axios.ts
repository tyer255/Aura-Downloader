import axios from 'axios';
import qs from 'qs';
async function test() {
  let data = qs.stringify({
    'q': 'https://www.instagram.com/reel/C89U8lSye0D/',
    't': 'media',
    'lang': 'en'
  });

  let config = {
    method: 'post',
    url: 'https://saveig.app/api/ajaxSearch',
    headers: {
      'authority': 'saveig.app',
      'accept': '*/*',
      'content-type': 'application/x-www-form-urlencoded',
      'origin': 'https://saveig.app',
      'referer': 'https://saveig.app/en',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
