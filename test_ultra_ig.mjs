const testUrl = "https://www.instagram.com/p/DB1D7rwyF9H/";

async function run() {
  try {
    const UltraIG = (await import('ultra-igdl')).default;
    const client = new UltraIG();
    console.log("UltraIG client created. Methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
    if (client.download) {
      const res = await client.download(testUrl);
      console.log("UltraIG download res:", JSON.stringify(res, null, 2));
    }
  } catch (e) {
    console.log("UltraIG error:", e.message);
  }

  try {
    const selxyzz = await import('@selxyzz/instagram-dl');
    console.log("@selxyzz exports:", selxyzz);
    const res = await (selxyzz.default || selxyzz.download)(testUrl);
    console.log("@selxyzz res:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.log("@selxyzz error:", e.message);
  }

  try {
    const igdlJs = await import('igdl.js');
    console.log("igdl.js exports:", igdlJs);
    const res = await (igdlJs.default || igdlJs)(testUrl);
    console.log("igdl.js res:", JSON.stringify(res, null, 2));
  } catch (e) {
    console.log("igdl.js error:", e.message);
  }
}

run();
