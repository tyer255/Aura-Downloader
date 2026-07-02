import ig from 'instagram-url-direct';
async function test() {
  try {
    const data = await ig.instagramGetUrl('https://www.instagram.com/p/C-R2sQhS9oH');
    console.log(data);
  } catch(e) { console.log(e.message); }
}
test();
