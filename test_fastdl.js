const formData = new URLSearchParams();
formData.append('url', 'https://www.instagram.com/stories/garvitxjat/3954939820216904951/');
formData.append('ts', Date.now().toString());
formData.append('_c', 'something');

async function test() {
  const res = await fetch("https://fastdl.app/c/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Origin": "https://fastdl.app",
      "Referer": "https://fastdl.app/en4"
    },
    body: formData
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
