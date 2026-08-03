async function test() {
  const mod = await import('btch-downloader');
  const b = mod.default || mod;
  console.log("b keys:", Object.keys(b));
  try {
    const r = await b.igdl('https://www.instagram.com/p/C3x-Z2_S0gY/');
    console.log(JSON.stringify(r, null, 2));
  } catch(e) { console.log(e); }
}

test();
