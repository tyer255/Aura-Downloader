import pkg from 'btch-downloader';
const { igdl, ttdl } = pkg;

async function run() {
  try {
    const ig = await igdl('https://www.instagram.com/p/C_B0bS3pD2L/');
    console.log("IG:", JSON.stringify(ig, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
run();
