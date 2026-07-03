import instagramGetUrl from "instagram-url-direct";
async function test() {
  try {
    const res = await instagramGetUrl("https://www.instagram.com/p/DBk3aIay2jQ/");
    console.log(res);
  } catch(e:any) {
    console.log(e.message);
  }
}
test();
