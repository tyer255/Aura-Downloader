async function test() {
  const res = await fetch('https://www.tikwm.com/api/?url=https://www.tiktok.com/@tiktok/video/7106594312292453678');
  const text = await res.json();
  console.log(text);
}
test();
