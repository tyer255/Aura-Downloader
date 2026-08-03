import * as btch from 'btch-downloader';

async function run() {
    let m = await import('btch-downloader');
    let b = m.default || m;
    const igdl = b.igdl || b.default?.igdl;
    if(igdl) {
      const r = await igdl("https://www.instagram.com/p/C9hV0C6y_nZ/");
      console.log(JSON.stringify(r, null, 2));
    }
}
run();
