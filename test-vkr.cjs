async function run() {
  const url = "https://www.instagram.com/p/C9Hh90OyzNq/";
  
  try {
     const res = await fetch(`https://vkrdownloader.vercel.app/server?vkr=${encodeURIComponent(url)}`);
     console.log(res.status);
     const data = await res.json();
     console.log(JSON.stringify(data).substring(0, 500));
  } catch (e) { console.log(e.message); }
}
run();
