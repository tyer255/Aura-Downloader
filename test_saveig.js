const formData = new URLSearchParams();
formData.append('q', 'https://www.instagram.com/stories/garvitxjat/3954939820216904951/');
formData.append('t', 'media');
formData.append('lang', 'en');

async function test() {
  const res = await fetch("https://v3.saveig.app/api/ajaxSearch", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0",
      "Origin": "https://saveig.app"
    },
    body: formData
  });
  console.log(res.status);
  console.log(await res.text());
}
test();
