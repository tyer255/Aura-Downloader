async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  
  try {
     console.log("Testing insta-fetcher...");
     const { igApi, getCookie } = require('insta-fetcher');
     const ig = new igApi("optional cookie"); // Maybe?
     console.log(await ig.fetchPost(url));
  } catch (e) { console.log(e.message); }
}
run();
