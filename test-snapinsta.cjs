const SnapInsta = require('snapinsta');
(async () => {
  try {
    const snap = new SnapInsta();
    const result = await snap.download('https://www.instagram.com/p/C_B0bS3pD2L/');
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(e.message);
  }
})();
