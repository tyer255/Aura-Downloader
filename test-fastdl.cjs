const axios = require('axios');
async function run() {
  const formData = new URLSearchParams();
  formData.append('url', 'https://www.instagram.com/reel/C7pM63fK30K/');
  // maybe it sends 'query' or 'url' in json?
  try {
    const res = await axios.post('https://fastdl.app/api/convert', {
      url: 'https://www.instagram.com/reel/C7pM63fK30K/'
    }, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://fastdl.app',
        'Referer': 'https://fastdl.app/en3'
      }
    });
    console.log(res.data);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
run();
