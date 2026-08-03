import fetch from 'node-fetch';
async function test() {
  const res = await fetch("http://localhost:3000/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://www.instagram.com/stories/garvitxjat/3954939820216904951?utm_source=ig_story_item_share&igsh=MXZyejRpaXozdWp5Zg==" })
  });
  const json = await res.json();
  console.log("Success:", json.success);
  console.log("Message:", json.message);
}
test();
