const { igApi } = require('insta-fetcher');
async function run() {
  const ig = new igApi(); // empty for no session?
  console.log(await ig.fetchPost('https://www.instagram.com/reel/C7pM63fK30K/'));
}
run();
