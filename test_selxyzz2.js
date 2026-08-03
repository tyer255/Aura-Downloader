async function test() {
  try {
    const mod = await import('@selxyzz/instagram-dl');
    const ig = mod.default || mod;
    console.log("module:", Object.keys(ig));
    if (typeof ig === 'function') {
      const res = await ig("https://www.instagram.com/stories/garvitxjat/3954939820216904951/");
      console.log(JSON.stringify(res, null, 2));
    }
  } catch(e) { console.log(e); }
}
test();
