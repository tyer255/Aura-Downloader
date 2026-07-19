const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
        if (platform === 'pinterest') {
            console.log("Trying native extractor for Pinterest...");
            
            // Resolve pin.it URLs first so fallbacks can use the real URL
            let resolvedUrl = trimmedUrl;
            if (trimmedUrl.includes('pin.it')) {
                try {
                    const resp = await fetch(trimmedUrl, { redirect: 'manual' });
                    if (resp.status >= 300 && resp.status < 400) {
                        resolvedUrl = resp.headers.get('location') || resolvedUrl;
                        if (resolvedUrl.includes('api.pinterest.com/url_shortener')) {
                           const redirectResp = await fetch(resolvedUrl, { redirect: 'manual' });
                           if (redirectResp.status >= 300 && redirectResp.status < 400) {
                              resolvedUrl = redirectResp.headers.get('location') || resolvedUrl;
                           }
                        }
                    }
                } catch(e) {}
            }
            trimmedUrl = resolvedUrl;
            
            const nativeResult = await extractPinterestNative(trimmedUrl);
`;

code = code.replace(/if\s*\(platform\s*===\s*'pinterest'\)\s*\{\s*console\.log\("Trying native extractor for Pinterest..."\);\s*const nativeResult = await extractPinterestNative\(trimmedUrl\);/, replacement.trim());

fs.writeFileSync('server.ts', code);
console.log('patched2');
