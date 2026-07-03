import fetch from "node-fetch";

async function test() {
  const url = "https://www.instagram.com/p/DBk3aIay2jQ/";
  try {
    const res = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ url: url })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch(e:any) {
    console.log(e.message);
  }
}
test();
