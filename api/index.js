const path = require('path');
const { startServer } = require('../dist/server.cjs');

let appPromise = startServer();

module.exports = async (req, res) => {
  const app = await appPromise;
  return app(req, res);
};
