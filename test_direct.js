import instagramGetUrl from 'instagram-url-direct';
async function test() {
  try {
    const res = await instagramGetUrl("https://www.instagram.com/stories/garvitxjat/3954939820216904951/");
    console.log("direct:", JSON.stringify(res, null, 2));
  } catch(e) { console.log(e); }
}
test();
