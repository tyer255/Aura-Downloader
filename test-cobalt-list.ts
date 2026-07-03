async function test() {
  const res = await fetch('https://cobalt.directory/api/working');
  const data = await res.json();
  const instances = data.data.instagram;
  for (const inst of instances) {
    try {
      const resp = await fetch(inst, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: 'https://www.instagram.com/p/DBk3aIay2jQ/' })
      });
      console.log(inst, resp.status);
      if (resp.status === 200 || resp.status === 400 || resp.status === 500) {
        console.log(await resp.text());
      }
    } catch(e) {
      console.log(inst, e.message);
    }
  }
}
test();
