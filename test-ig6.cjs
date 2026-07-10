async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  
  try {
     console.log("Testing @jerrycoder/instagram-api...");
     const jerry = await import('@jerrycoder/instagram-api');
     console.log(await jerry.instagram(url));
  } catch (e) { console.log(e.message); }
  
}
run();
