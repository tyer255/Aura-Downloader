async function test() {
   const res = await fetch('https://www.pinterest.com/pin/524317456637385732/');
   const text = await res.text();
   const fs = require('fs');
   fs.writeFileSync('test_pin6.html', text);
   console.log("Length:", text.length);
}
test();
