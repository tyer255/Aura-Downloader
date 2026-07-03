import fetch from "node-fetch";

async function test() {
  const url = "https://www.instagram.com/p/DBk3aIay2jQ/";
  try {
    const res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${url}`, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    console.log(res.status);
    console.log(await res.text());
  } catch(e:any) {
    console.log(e.message);
  }
}
test();
