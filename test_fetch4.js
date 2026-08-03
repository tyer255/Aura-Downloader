import fetch from 'node-fetch';
async function test() {
  const res = await fetch("http://localhost:3000/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://www.instagram.com/p/DO3YV7jEkxB/" })
  });
  const json = await res.json();
  console.log("Success:", json.success);
  console.log("Media count:", json.media ? json.media.length : 0);
  console.log("Source:", json.source);
  if (json.media) {
    json.media.forEach((m, i) => {
      console.log(`[${i}] ID: ${m.id} URL: ${m.url?.substring(0, 80)}`);
    });
  }
}
test();
