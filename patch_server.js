import fs from 'fs';
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`app.post("/api/download", async (req, res) => {
    const originalJson = res.json.bind(res);
    res.json = function(body) {
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
    };`,
`app.post("/api/download", async (req, res) => {`
);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts download route to remove res.json override");
