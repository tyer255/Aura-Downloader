async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  
  try {
     const fd = new URLSearchParams();
     fd.append("url", url);
     fd.append("action", "post");
     
     const res = await fetch("https://snapinsta.app/action.php", {
       method: 'POST',
       headers: {
         'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
         'Accept': 'application/json, text/javascript, */*; q=0.01',
         'Origin': 'https://snapinsta.app',
         'Referer': 'https://snapinsta.app/',
         'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
         'X-Requested-With': 'XMLHttpRequest'
       },
       body: fd
     });
     console.log(res.status);
     const text = await res.text();
     console.log(text.substring(0, 1000));
  } catch (e) { console.log(e.message); }
}
run();
