async function run() {
  const url = "https://www.instagram.com/p/C_B0bS3pD2L/";
  try {
    const res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log(e.message);
  }
}
run();
