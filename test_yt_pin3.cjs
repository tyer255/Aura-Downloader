const youtubedl = require('youtube-dl-exec');
youtubedl('https://www.pinterest.com/pin/28851253859769811/', { dumpSingleJson: true, noWarnings: true })
  .then(output => console.log(output.url || (output.requested_formats ? output.requested_formats[0].url : output.formats[0].url)))
  .catch(err => console.error(err.message));
