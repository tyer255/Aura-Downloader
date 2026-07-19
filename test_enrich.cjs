const fetch = require('node-fetch');

async function test() {
    const sizeCache = new Map();

    function formatBytes(bytes) {
        if (bytes === 0) return "0 MB";
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async function fetchFileSize(url) {
        if (sizeCache.has(url)) return sizeCache.get(url);
        
        if (url.includes('m3u8')) return "Unknown Size";
        let targetUrl = url;
        if (url.startsWith('/api/proxy-download') || url.includes('/api/proxy-download')) {
            const match = url.match(/[?&]url=([^&]+)/);
            if (match) {
                 targetUrl = decodeURIComponent(match[1]);
            }
        } else if (url.startsWith('/api/')) {
            return "Unknown Size";
        }

        try {
            const parsed = new URL(targetUrl);
            const client = parsed.protocol === 'https:' ? require('https') : require('http');
            
            const size = await new Promise((resolve) => {
                const req = client.request(targetUrl, { method: 'HEAD', timeout: 3000, headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                } }, (res) => {
                    if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        let redirectUrl = res.headers.location;
                        if (!redirectUrl.startsWith('http')) {
                             redirectUrl = parsed.origin + (redirectUrl.startsWith('/') ? '' : '/') + redirectUrl;
                        }
                        const redirParsed = new URL(redirectUrl);
                        const redirClient = redirParsed.protocol === 'https:' ? require('https') : require('http');
                        const redirReq = redirClient.request(redirParsed, { method: 'HEAD', timeout: 3000, headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                        } }, (redirRes) => {
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

    async function enrichResultSizes(result) {
        if (!result || !result.qualities || !Array.isArray(result.qualities)) return result;
        
        const fetchPromises = result.qualities.map(async (q) => {
            if (!q.url) return;
            const sizeStr = String(q.size || "");
            
            let needsFetch = false;
            if (!q.size || q.size === 'Unknown' || sizeStr === '0 MB' || sizeStr === '~ 0 MB' || sizeStr.match(/^[a-zA-Z\s]+$/)) {
                needsFetch = true;
            }

            if (needsFetch) {
                const realSize = await fetchFileSize(q.url);
                q.size = realSize;
            }
        });
        
        await Promise.allSettled(fetchPromises);
        return result;
    }

    const testResult = {
        qualities: [
            { url: "https://www.w3schools.com/html/mov_bbb.mp4", size: "~ 0 MB" },
            { url: "https://v1.pinimg.com/videos/iht/hls/be/c2/f1/bec2f1249c02808704c5b68d82e3ae64_720w.m3u8", size: "Unknown" },
            { url: "https://example.com/bad", size: "0 MB" }
        ]
    };
    await enrichResultSizes(testResult);
    console.log(JSON.stringify(testResult, null, 2));
}
test();
