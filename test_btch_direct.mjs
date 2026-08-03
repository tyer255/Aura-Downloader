import { HttpGet } from 'btch-downloader/dist/Defaults/btch.http.js';

async function run() {
  const url = "https://www.instagram.com/p/DB1D7rwyF9H/";
  console.log("Calling HttpGet for igdl...");
  try {
    const rawData = await HttpGet('igdl', url, '3.0.3', 10000, 'https://api.btch.bz');
    console.log("Raw HttpGet response:", JSON.stringify(rawData, null, 2));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

run();
