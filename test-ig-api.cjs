const { IgApiClient } = require('instagram-private-api');
async function run() {
  const ig = new IgApiClient();
  ig.state.generateDevice('someuser');
  try {
    const info = await ig.media.info('3380289817184795914');
    console.log(info);
  } catch (e) {
    console.error(e.message);
  }
}
run();
