const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const funcs = `
const sizeCache = new Map<string, string>();

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 MB";
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function fetchFileSize(url: string): Promise<string> {
    if (sizeCache.has(url)) return sizeCache.get(url)!;
    
    if (url.startsWith('/api/') || url.includes('/api/proxy-download') || url.includes('m3u8')) {
        return "Unknown Size";
    }

    try {
        const parsed = new URL(url);
        const client = parsed.protocol === 'https:' ? require('https') : require('http');
        
        const size: number | null = await new Promise((resolve) => {
            const req = client.request(url, { method: 'HEAD', timeout: 3000, headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            } }, (res: any) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let redirectUrl = res.headers.location;
                    if (!redirectUrl.startsWith('http')) {
                         redirectUrl = parsed.origin + (redirectUrl.startsWith('/') ? '' : '/') + redirectUrl;
                    }
                    const redirParsed = new URL(redirectUrl);
                    const redirClient = redirParsed.protocol === 'https:' ? require('https') : require('http');
                    const redirReq = redirClient.request(redirParsed, { method: 'HEAD', timeout: 3000, headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    } }, (redirRes: any) => {
                        if (redirRes.headers['content-length']) {
                            resolve(parseInt(redirRes.headers['content-length'], 10));
                        } else {
                            resolve(null);
                        }
                    });
                    redirReq.on('error', () => resolve(null));
                    redirReq.on('timeout', () => { redirReq.destroy(); resolve(null); });
                    redirReq.end();
                } else if (res.headers['content-length']) {
                    resolve(parseInt(res.headers['content-length'], 10));
                } else {
                    resolve(null);
                }
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
            req.end();
        });
        
        const formatted = size ? formatBytes(size) : "Unknown Size";
        sizeCache.set(url, formatted);
        return formatted;
    } catch(e) {
        return "Unknown Size";
    }
}

async function enrichResultSizes(result: any) {
    if (!result || !result.qualities || !Array.isArray(result.qualities)) return result;
    
    const fetchPromises = result.qualities.map(async (q: any) => {
        if (!q.url) return;
        const sizeStr = String(q.size || "");
        
        let needsFetch = false;
        if (!q.size || q.size === 'Unknown' || sizeStr.includes('0 MB') || sizeStr.includes('~ 0 MB') || sizeStr.match(/^[a-zA-Z\\s]+$/)) {
            needsFetch = true;
        }

        if (needsFetch) {
            const realSize = await fetchFileSize(q.url);
            q.size = realSize;
        } else {
            // Keep existing valid size like "~ 12 MB"
        }
    });
    
    await Promise.allSettled(fetchPromises);
    return result;
}
`;

if (!code.includes('async function enrichResultSizes')) {
    code = code.replace('app.post("/api/download", async (req, res) => {', funcs + '\napp.post("/api/download", async (req, res) => {\n    const originalJson = res.json.bind(res);\n    res.json = async function(body) {\n        if (body && body.success) {\n            body = await enrichResultSizes(body);\n        }\n        return originalJson(body);\n    };\n');
    fs.writeFileSync('server.ts', code);
    console.log('patched successfully');
} else {
    console.log('already patched');
}
