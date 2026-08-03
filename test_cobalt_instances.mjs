async function run() {
  try {
    const res = await fetch("https://instances.hyper.lol/instances.json");
    const instances = await res.json();
    console.log("Total Cobalt instances:", instances.length);

    const testUrl = "https://www.instagram.com/p/DB1D7rwyF9H/";

    for (const inst of instances) {
      if (!inst.api || inst.cors !== 1) continue;
      console.log(`Testing instance: ${inst.url} (version: ${inst.version})`);
      try {
        const apiRes = await fetch(`${inst.url}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ url: testUrl })
        });
        console.log(`  Status for ${inst.url}:`, apiRes.status);
        const data = await apiRes.json();
        console.log(`  Data for ${inst.url}:`, JSON.stringify(data).substring(0, 300));
        if (data.status === "picker" || data.status === "stream" || data.status === "redirect" || data.picker || data.url) {
          console.log(`  >>> WORKING INSTANCE FOUND: ${inst.url}`);
          break;
        }
      } catch (e) {
        console.log(`  Failed ${inst.url}:`, e.message);
      }
    }
  } catch (e) {
    console.log("Error fetching instances:", e.message);
  }
}

run();
