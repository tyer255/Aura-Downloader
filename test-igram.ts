async function test() {
  const url = 'https://www.instagram.com/p/DBk3aIay2jQ/';
  try {
     const res = await fetch('https://igram.world/api/ig/userInfoByUrl?url=' + encodeURIComponent(url));
     console.log(res.status);
     console.log(await res.text());
  } catch(e) {
     console.log(e.message);
  }
}
test();
