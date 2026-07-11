const std = ['PATH', 'NODE_ENV', 'HOSTNAME', 'HOME', 'USER', 'PWD', 'SHLVL', 'TZ', 'TERM', 'YARN_VERSION', 'npm_config_loglevel', 'npm_config_user'];
console.log(Object.keys(process.env).filter(k => !std.includes(k) && !k.startsWith('npm_') && !k.startsWith('NVM_')));
