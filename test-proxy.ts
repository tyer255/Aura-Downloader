import https from 'https';

const url = 'https://cdn406.savetube.vip/media/0PT5c1z3LL8/microplastics-are-accumulating-in-human-brains-at-an-alarming-rate-360-ytshorts.savetube.me.mp4';
const requestOptions = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Accept": "*/*"
  }
};
https.get(url, requestOptions, (res) => {
  console.log("Status:", res.statusCode);
  res.on('data', d => process.stdout.write(d.toString().substring(0, 100)));
});
