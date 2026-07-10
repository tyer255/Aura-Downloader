const axios = require('axios');
async function run() {
  const formData = new URLSearchParams();
  formData.append('query', 'https://www.instagram.com/reel/C7pM63fK30K/');
  try {
    const res = await axios.post('https://fastdl.app/api/convert', formData, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://fastdl.app',
        'Referer': 'https://fastdl.app/en3',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log(res.data);
  } catch(e) {
    console.log(e.response ? e.response.data : e.message);
  }
}
run();
