async function run() {
  const url = 'https://www.pinterest.com/pin/331366485093774888/'; // a random pin
  const res = await fetch("https://cobalt.q0.is/api/json", {
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
