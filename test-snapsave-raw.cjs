const axios = require('axios');
async function run() {
  const formData = new URLSearchParams();
  formData.append('url', 'https://www.instagram.com/reel/C7pM63fK30K/');
  const res = await axios.post('https://snapsave.app/action.php?lang=en', formData, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://snapsave.app',
      'Referer': 'https://snapsave.app/en'
    }
  });
  console.log(res.data);
}
run();
