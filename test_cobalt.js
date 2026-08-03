async function test() {
  const res = await fetch("https://api.cobalt.tools/api/json", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: "https://www.instagram.com/stories/garvitxjat/3954939820216904951/" })
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
