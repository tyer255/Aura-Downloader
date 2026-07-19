async function run() {
  const url = 'https://www.pinterest.com/pin/341851427956802746/';
  const res = await fetch("https://cobalt.kwiatekit.com/", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ url: url })
  });
  const data = await res.json();
  console.log(data);
}
run();
