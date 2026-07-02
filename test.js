const fetch = require('node-fetch');
async function run() {
  const res = await fetch('https://api.vkrdownloader.vercel.app/server?vkr=https://www.youtube.com/shorts/URnFRWjR_xI');
  console.log(await res.text());
}
run();
