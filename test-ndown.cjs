async function ndown(url) {
  try {
    const res = await fetch("https://ndown.pro/api/videodownloader", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "accept": "*/*",
        "origin": "https://ndown.pro",
        "referer": "https://ndown.pro/",
        "user-agent": "Mozilla/5.0"
      },
      body: new URLSearchParams({ url })
    });
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  console.log(await ndown(url));
}
run();
