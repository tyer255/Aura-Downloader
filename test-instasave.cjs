async function run() {
  try {
     const fd = new URLSearchParams();
     fd.append("url", "https://www.instagram.com/p/C9Hh90OyzNq/");
     
     const res = await fetch("https://downloadgram.org/downloader", {
       method: 'POST',
       headers: {
         'User-Agent': 'Mozilla/5.0',
         'Content-Type': 'application/x-www-form-urlencoded',
         'Accept': 'application/json'
       },
       body: fd.toString()
     });
     console.log(res.status);
     const text = await res.text();
     console.log(text.substring(0, 1000));
  } catch(e) { console.log(e); }
}
run();
