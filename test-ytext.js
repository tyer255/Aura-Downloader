const yt = require('youtube-ext');
yt.videoInfo('https://www.youtube.com/watch?v=jNQXAC9IVRw').then(o => {
  console.log(o.stream);
});
