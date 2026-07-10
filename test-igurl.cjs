const igurl = require('instagram-url-downloader');
async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  const instance = new igurl.downloader(url);
  console.log(await instance.asyncMedia);
}
run();
