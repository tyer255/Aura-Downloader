async function test() {
  const url = 'https://www.instagram.com/reel/C89U8lSye0D/';
  const form = new URLSearchParams();
  form.append('q', url);
  form.append('t', 'media');
  form.append('lang', 'en');
  try {
     const res = await fetch('https://saveig.app/api/ajaxSearch', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: form.toString()
     });
     console.log(res.status, await res.text());
  } catch(e) { console.log(e.message); }
}
test();
