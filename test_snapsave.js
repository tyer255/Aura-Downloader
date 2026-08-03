import fetch from 'node-fetch';

async function testSnapSaveRaw() {
  const postUrl = "https://www.instagram.com/p/C3x-Z2_S0gY/";
  const params = new URLSearchParams();
  params.append('q', postUrl);
  params.append('vt', 'instagram');

  const res = await fetch("https://snapsave.app/action.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Origin": "https://snapsave.app",
      "Referer": "https://snapsave.app/"
    },
    body: params
  });

  if (res.ok) {
    const rawText = await res.text();
    console.log("SnapSave rawText snippet:\n", rawText.substring(0, 500));
  }
}

testSnapSaveRaw();
