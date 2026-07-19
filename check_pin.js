async function run() {
  const url = "https://www.pinterest.com/pin/28851253859769811/";
  const res = await fetch(url, {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  const html = await res.text();
  const match = html.match(/<script id="__PWS_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (match) {
    const data = JSON.parse(match[1]);
    console.log("DATA KEYS:", Object.keys(data));
    if (data.props) {
        console.log("PROPS KEYS:", Object.keys(data.props));
        if (data.props.initialReduxState) {
            console.log("REDUX KEYS:", Object.keys(data.props.initialReduxState));
            if (data.props.initialReduxState.pins) {
                const pin = data.props.initialReduxState.pins["28851253859769811"];
                if (pin) console.log("PIN HAS VIDEOS?", !!pin.videos, !!pin.story_pin_data);
            }
        }
    }
  }
}
run();
