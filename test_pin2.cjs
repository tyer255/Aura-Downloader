const mod = require('btch-downloader');
const pin = mod.pinterest;
pin('https://pin.it/2JmF6d9wN')
  .then(output => console.log(JSON.stringify(output, null, 2)))
  .catch(err => console.error(err));
