async function run() {
  console.log("Testing btch-downloader...");
  try {
    const btchModule = await import("btch-downloader");
    const igdl = btchModule.igdl || btchModule.default?.igdl;
    console.log("igdl exists:", typeof igdl);
    if (igdl) {
      const res = await igdl("https://www.instagram.com/p/DB1D7rwyF9H/");
      console.log("btch igdl res:", JSON.stringify(res, null, 2).substring(0, 500));
    }
  } catch (e) {
    console.log("btch error:", e.message);
  }

  console.log("\nTesting snapinsta...");
  try {
    const snapModule = await import("snapinsta");
    const getLinks = snapModule.SnapInsta || snapModule.default?.SnapInsta || snapModule.getLinks;
    console.log("snapinsta getLinks exists:", typeof getLinks);
    if (getLinks) {
      const res = await getLinks("https://www.instagram.com/p/DB1D7rwyF9H/");
      console.log("snapinsta res:", JSON.stringify(res, null, 2).substring(0, 500));
    }
  } catch (e) {
    console.log("snapinsta error:", e.message);
  }
}

run();
