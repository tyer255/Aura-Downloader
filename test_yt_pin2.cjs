const youtubedl = require('youtube-dl-exec');
youtubedl('https://www.pinterest.com/pin/28851253859769811/', { dumpSingleJson: true, noWarnings: true })
  .then(output => console.log(JSON.stringify(output, null, 2).substring(0, 500)))
  .catch(err => console.error(err.message));
