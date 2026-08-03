async function testMore() {
  const url = "https://www.instagram.com/p/C3x-Z2_S0gY/";

  // 1. instagram-url-direct default or named export
  try {
    const pkg = await import('instagram-url-direct');
    const fn = pkg.default || pkg;
    console.log("instagram-url-direct keys:", Object.keys(pkg));
    if (typeof fn === 'function') {
      const res = await fn(url);
      console.log("instagram-url-direct result:", res);
    }
  } catch(e) { console.log("instagram-url-direct err:", e.message); }

  // 2. ultra-igdl
  try {
    const pkg = await import('ultra-igdl');
    console.log("ultra-igdl keys:", Object.keys(pkg));
    const fn = pkg.default || pkg.igdl || pkg;
    if (typeof fn === 'function') {
      const res = await fn(url);
      console.log("ultra-igdl result:", res);
    }
  } catch(e) { console.log("ultra-igdl err:", e.message); }

  // 3. igdl.js
  try {
    const pkg = await import('igdl.js');
    console.log("igdl.js keys:", Object.keys(pkg));
    const fn = pkg.default || pkg.igdl || pkg;
    if (typeof fn === 'function') {
      const res = await fn(url);
      console.log("igdl.js result:", res);
    }
  } catch(e) { console.log("igdl.js err:", e.message); }

  // 4. @selxyzz/instagram-dl
  try {
    const pkg = await import('@selxyzz/instagram-dl');
    console.log("@selxyzz/instagram-dl keys:", Object.keys(pkg));
  } catch(e) { console.log("@selxyzz/instagram-dl err:", e.message); }

  // 5. api-dylux
  try {
    const pkg = await import('api-dylux');
    console.log("api-dylux keys:", Object.keys(pkg));
    if (pkg.default?.igdl || pkg.igdl) {
      const fn = pkg.default?.igdl || pkg.igdl;
      const res = await fn(url);
      console.log("api-dylux igdl result:", res);
    }
  } catch(e) { console.log("api-dylux err:", e.message); }
}

testMore();
