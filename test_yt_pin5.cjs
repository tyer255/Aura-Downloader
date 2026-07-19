const youtubedl = require('youtube-dl-exec');
youtubedl('https://www.pinterest.com/pin/28851253859769811/', { dumpSingleJson: true, noWarnings: true })
  .then(output => {
     console.log(output.formats.map(f => f.format_id + ' ' + f.ext + ' ' + f.protocol + ' ' + f.url).join('\n'));
  })
  .catch(err => console.error(err.message));
