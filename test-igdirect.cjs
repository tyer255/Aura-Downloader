const ig = require('instagram-url-direct');
async function run() {
  const url = "https://www.instagram.com/reel/C8q7_w4P-Xz/";
  console.log(await ig.instagramGetUrl(url));
}
run();
