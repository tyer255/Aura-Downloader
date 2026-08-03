import yt from 'youtube-dl-exec';
async function run() {
  try {
    const res = await yt("https://www.instagram.com/stories/garvitxjat/3954939820216904951/", { dumpSingleJson: true });
    console.log("Success", res.id, res.title);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
