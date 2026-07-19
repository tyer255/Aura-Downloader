import https from 'https';
import http from 'http';
import { URL } from 'url';

export async function getFileSize(url: string): Promise<number | null> {
    return new Promise((resolve) => {
        try {
            const parsed = new URL(url);
            const client = parsed.protocol === 'https:' ? https : http;
            
            const req = client.request(url, { method: 'HEAD', timeout: 3000 }, (res) => {
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    getFileSize(res.headers.location).then(resolve);
                } else if (res.headers['content-length']) {
                    resolve(parseInt(res.headers['content-length'], 10));
                } else {
                    resolve(null);
                }
            });
            req.on('error', () => resolve(null));
            req.on('timeout', () => { req.destroy(); resolve(null); });
            req.end();
        } catch(e) {
            resolve(null);
        }
    });
}
getFileSize('https://www.w3schools.com/html/mov_bbb.mp4').then(s => console.log(s));
