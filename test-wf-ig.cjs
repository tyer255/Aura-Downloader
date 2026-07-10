const { instagramGetUrl } = require('wf-instagram-url-direct');
async function run() {
  console.log(await instagramGetUrl('https://www.instagram.com/reel/C7pM63fK30K/'));
}
run();
