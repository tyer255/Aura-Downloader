async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  
  try {
     console.log("Testing instagram-dl...");
     const igdl = require('instagram-dl');
     console.log(await igdl(url));
  } catch (e) { console.log(e.message); }
  
}
run();
