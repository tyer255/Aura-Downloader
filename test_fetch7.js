import fetch from 'node-fetch';
async function test() {
  const res = await fetch("http://localhost:3000/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://www.instagram.com/s/aGlnaGxpZ2h0" })
  });
  const json = await res.json();
  console.log("Success:", json.success);
  console.log("Message:", json.message);
}
test();
