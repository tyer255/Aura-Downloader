const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /res\.json = async function\(body\)\s*\{\s*if \(body && body\.success\)\s*\{\s*body = await enrichResultSizes\(body\);\s*\}\s*return originalJson\(body\);\s*\};/g;

code = code.replace(regex, `res.json = function(body) {
        if (body && body.success) {
            enrichResultSizes(body).then(enriched => {
                originalJson(enriched);
            }).catch(e => {
                originalJson(body);
            });
        } else {
            originalJson(body);
        }
        return this;
    };`);

fs.writeFileSync('server.ts', code);
