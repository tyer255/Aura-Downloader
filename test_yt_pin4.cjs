const youtubedl = require('youtube-dl-exec');
youtubedl('https://www.pinterest.com/pin/28851253859769811/', { dumpSingleJson: true, noWarnings: true })
  .then(output => {
     const mp4s = output.formats.filter(f => f.ext === 'mp4' && f.vcodec !== 'none');
     console.log(mp4s.map(f => f.url).join('\n'));
  })
  .catch(err => console.error(err.message));
