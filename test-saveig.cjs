async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  
  try {
     const fd = new URLSearchParams();
     fd.append("q", url);
     fd.append("t", "media");
     fd.append("lang", "en");
     
     const res = await fetch("https://saveig.app/api/ajaxSearch", {
       method: 'POST',
       headers: {
         'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
         'Accept': 'application/json, text/javascript, */*; q=0.01',
         'Origin': 'https://saveig.app',
         'Referer': 'https://saveig.app/',
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
