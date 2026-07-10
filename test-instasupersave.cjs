async function run() {
  try {
     const res = await fetch("https://instasupersave.com/api/ig/post?url=https://www.instagram.com/p/C9Hh90OyzNq/", {
       method: 'GET',
       headers: {
         'User-Agent': 'Mozilla/5.0',
         'Accept': 'application/json'
       }
     });
     console.log(res.status);
     const text = await res.text();
     console.log(text.substring(0, 1000));
  } catch(e) { console.log(e); }
}
run();
