async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  try {
     const play = require('play-dl');
     console.log(await play.video_info(url));
  } catch (e) { console.log(e.message); }
}
run();
