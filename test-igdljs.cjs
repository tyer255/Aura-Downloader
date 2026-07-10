async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  try {
     const { igdl } = require('igdl.js');
     console.log(await igdl(url));
  } catch (e) { console.log(e.message); }
}
run();
