import fetch from 'node-fetch';

function decodeSnapSaveJS(jsCode) {
  try {
    // SnapSave uses function _0xe63c(d,e,f) or standard packed function
    // We can evaluate the function safely by replacing `eval` with return statement
    if (jsCode.includes('eval(f(') || jsCode.includes('eval(')) {
      let codeToExec = jsCode;
      // Replace eval( at the end with a return
      const lastEvalIdx = codeToExec.lastIndexOf('eval(');
      if (lastEvalIdx !== -1) {
        codeToExec = codeToExec.substring(0, lastEvalIdx) + 'return ' + codeToExec.substring(lastEvalIdx + 5, codeToExec.length - 1);
        const func = new Function(codeToExec);
        const htmlResult = func();
        return htmlResult;
      }
    }
  } catch(e) {
    console.log("Decoder error:", e.message);
  }
  return null;
}

async function testSnapSaveDecoder() {
  const shortcode = "C3x-Z2_S0gY";
  const postUrl = `https://www.instagram.com/p/${shortcode}/`;
  const params = new URLSearchParams();
  params.append('q', postUrl);
  params.append('vt', 'instagram');

  const res = await fetch("https://snapsave.app/action.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Origin": "https://snapsave.app",
      "Referer": "https://snapsave.app/"
    },
    body: params
  });

  if (res.ok) {
    const rawText = await res.text();
    const decodedHtml = decodeSnapSaveJS(rawText);
    console.log("Decoded HTML len:", decodedHtml ? decodedHtml.length : null);
    if (decodedHtml) {
      console.log("Decoded HTML snippet:\n", decodedHtml.substring(0, 500));
      
      // Parse images and video links from decoded HTML!
      const downloadLinks = [...decodedHtml.matchAll(/href="([^"]+)"/gi)].map(m => m[1]);
      const imgSources = [...decodedHtml.matchAll(/src="([^"]+)"/gi)].map(m => m[1]);
      
      console.log("Download links count:", downloadLinks.length);
      downloadLinks.forEach((l, i) => console.log(`  Link ${i+1}:`, l.substring(0, 100)));
    }
  }
}

testSnapSaveDecoder();
