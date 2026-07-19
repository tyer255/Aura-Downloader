const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
    'res.json = async function(body) {\\n        if (body && body.success) {\\n            body = await enrichResultSizes(body);\\n        }\\n        return originalJson(body);\\n    };',
    'res.json = function(body) {\\n        if (body && body.success) {\\n            enrichResultSizes(body).then(enriched => {\\n                originalJson(enriched);\\n            }).catch(e => {\\n                originalJson(body);\\n            });\\n        } else {\\n            originalJson(body);\\n        }\\n        return this;\\n    };'
);

fs.writeFileSync('server.ts', code);
