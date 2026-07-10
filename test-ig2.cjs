const nayan = require('nayan-media-downloaders');
async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  console.log("Testing nayan...");
  try {
     const res = await nayan.instagram(url);
     console.log(res);
  } catch (e) {
     console.log(e.message);
  }
}
run();
