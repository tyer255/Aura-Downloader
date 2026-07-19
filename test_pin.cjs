const youtubedl = require('youtube-dl-exec');
youtubedl('https://pin.it/2JmF6d9wN', { dumpSingleJson: true, noWarnings: true })
  .then(output => console.log(JSON.stringify(output, null, 2)))
  .catch(err => console.error(err));
