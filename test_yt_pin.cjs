const youtubedl = require('youtube-dl-exec');
youtubedl('https://www.pinterest.com/pin/28851253859769811/', { dumpSingleJson: true, noWarnings: true })
  .then(output => {
      console.log("Output has video?", output.url ? "Yes" : "No");
      console.log(output.url);
  })
  .catch(err => console.error(err.message));
