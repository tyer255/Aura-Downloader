async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  const fetch = (await import('node-fetch')).default;
  
  console.log("Testing apis...");
  try {
     const res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`);
     const data = await res.json();
     console.log("Ryzen:", data);
  } catch (e) { console.log(e.message); }
  
}
run();
