async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  
  try {
     console.log("Testing @sasmeee/igdl...");
     const igdl = require('@sasmeee/igdl');
     console.log(await igdl(url));
  } catch (e) { console.log(e.message); }
  
}
run();
