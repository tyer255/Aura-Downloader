import ig from 'instagram-url-direct';
async function test() {
  const data = await ig.instagramGetUrl('https://www.instagram.com/reel/C-R2sQhS9oH/');
  console.log(data);
}
test();
