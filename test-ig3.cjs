async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  
  try {
     console.log("Testing @sasmeee/igdl...");
     const igdl = require('@sasmeee/igdl');
     console.log(await igdl(url));
  } catch (e) { console.log(e.message); }
  
  try {
     console.log("Testing igdl.js...");
     const igdljs = require('igdl.js');
     console.log(await igdljs.igdl(url));
  } catch (e) { console.log(e.message); }
  
  try {
     console.log("Testing instagram-url-downloader...");
     const igurl = require('instagram-url-downloader');
     console.log(await igurl(url));
  } catch (e) { console.log(e.message); }
  
  try {
     console.log("Testing @mrnima/instagram-downloader...");
     const mrnima = require('@mrnima/instagram-downloader');
     console.log(await mrnima.igdl(url));
  } catch (e) { console.log(e.message); }
}
run();
