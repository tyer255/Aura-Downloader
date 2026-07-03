import { igApi } from 'insta-fetcher';
async function test() {
  try {
     const ig = new igApi();
     const res = await ig.fetchPost('https://www.instagram.com/reel/C89U8lSye0D/');
     console.log(res);
  } catch(e) { console.log('err:', e.message); }
}
test();
