import fetch from "node-fetch";

async function extractWithCobalt(url: string) {
  let instances = [
    'https://api.cobalt.tools',
    'https://cobalt-api.pewpew.nyc',
    'https://co.wuk.sh',
    'https://cobalt.tu.fo',
    'https://cobalt.qewertyy.dev',
    'https://rue-cobalt.xenon.zone'
  ];

  for (const inst of instances) {
    try {
      const response = await fetch(inst, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ url: url })
      });
      if (!response.ok) continue;
      const data = await response.json();
      console.log(`Success with ${inst}`);
      return data;
    } catch(e) {}
  }
}

extractWithCobalt('https://www.youtube.com/watch?v=0PT5c1z3LL8').then(console.log);
