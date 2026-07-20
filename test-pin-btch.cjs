const btch = require('btch-downloader');

async function test() {
  const url = "https://in.pinterest.com/pin/1033013233246726297/";
  const pinterest = btch.pinterest || (btch.default && btch.default.pinterest);
  if (!pinterest) {
    console.log("no pinterest function");
    return;
  }
  const res = await pinterest(url);
  console.log(JSON.stringify(res, null, 2));
}
test();
