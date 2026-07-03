async function test() {
  const url = 'https://www.instagram.com/reel/C89U8lSye0D/';
  try {
     const res = await fetch('https://publer.io/api/v1/tools/media/extract', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ url })
     });
     console.log(res.status, await res.text());
  } catch(e) { console.log(e.message); }
}
test();
