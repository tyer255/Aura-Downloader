async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  const api = "https://api.cobalt.tools/";
  try {
      const res = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ url: url })
      });
      console.log(await res.text());
  } catch (e) {
      console.log(e.message);
  }
}
run();
