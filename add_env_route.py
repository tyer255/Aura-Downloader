import re

with open("server.ts", "r") as f:
    content = f.read()

route = '''
app.get("/api/env-debug2", (req, res) => {
    const std = ['PATH', 'NODE_ENV', 'HOSTNAME', 'HOME', 'USER', 'PWD', 'SHLVL', 'TZ', 'TERM', 'YARN_VERSION'];
    res.json({
        keys: Object.keys(process.env).filter(k => !std.includes(k) && !k.startsWith('npm_') && !k.startsWith('NVM_'))
    });
});
'''

content = content.replace('app.get("/api/ping",', route + '\napp.get("/api/ping",')

with open("server.ts", "w") as f:
    f.write(content)
