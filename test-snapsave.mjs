import { snapsave } from 'snapsave-media-downloader';
async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  console.log(JSON.stringify(await snapsave(url), null, 2));
}
run();
