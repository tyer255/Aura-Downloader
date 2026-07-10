const dns = require('dns');
const { Resolver } = dns;
const resolver = new Resolver();
resolver.setServers(['8.8.8.8', '8.8.4.4']);
resolver.resolve4('api.vreden.web.id', (err, addresses) => {
  console.log(err || addresses);
});
resolver.resolve4('snapinsta.app', (err, addresses) => {
  console.log(err || addresses);
});
