import igdl from '@selxyzz/instagram-dl';
async function test() {
  try {
    const res = await igdl("https://www.instagram.com/stories/garvitxjat/3954939820216904951/");
    console.log("selxyzz:", JSON.stringify(res, null, 2));
  } catch(e) { console.log(e); }
}
test();
