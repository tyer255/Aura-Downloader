async function test() {
  const url = 'https://www.instagram.com/reel/C89U8lSye0D/';
  try {
     const res = await fetch('https://vihangayt.me/download/instagram?url=' + encodeURIComponent(url));
     console.log(res.status, await res.text());
  } catch(e) { console.log(e.message); }
}
test();
