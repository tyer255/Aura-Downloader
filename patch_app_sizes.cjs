const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const [fetchedSizes, setFetchedSizes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!result) return;
    const list = sanitizeQualities(result.qualities, result.url);
    list.forEach(q => {
      if (q.url && !q.size && !fetchedSizes[q.url]) {
        const proxyUrl = q.url.startsWith('/api/') ? q.url : \`/api/proxy-download?url=\${encodeURIComponent(q.url)}&filename=media\`;
        fetch(proxyUrl, { method: 'HEAD' })
          .then(res => {
            const len = res.headers.get('content-length') || res.headers.get('estimated-content-length');
            if (len) {
              const bytes = parseInt(len, 10);
              if (bytes > 0) {
                const formatted = formatBytes(bytes);
                if (formatted) {
                  setFetchedSizes(prev => ({ ...prev, [q.url]: formatted }));
                }
              }
            }
          })
          .catch(() => {});
      }
    });
    if (result.media && Array.isArray(result.media)) {
      result.media.forEach((item: any) => {
        if (item.url && !fetchedSizes[item.url]) {
          const proxyUrl = item.url.startsWith('/api/') ? item.url : \`/api/proxy-download?url=\${encodeURIComponent(item.url)}&filename=media\`;
          fetch(proxyUrl, { method: 'HEAD' })
            .then(res => {
              const len = res.headers.get('content-length') || res.headers.get('estimated-content-length');
              if (len) {
                const bytes = parseInt(len, 10);
                if (bytes > 0) {
                  const formatted = formatBytes(bytes);
                  if (formatted) {
                    setFetchedSizes(prev => ({ ...prev, [item.url]: formatted }));
                  }
                }
              }
            })
            .catch(() => {});
        }
      });
    }
  }, [result]);`;

const replacement = `  const [fetchedSizes, setFetchedSizes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!result) return;
    const list = sanitizeQualities(result.qualities, result.url);
    
    const fetchSize = async (url: string) => {
      if (!url || fetchedSizes[url]) return;
      
      try {
        let targetUrl = url;
        if (url.startsWith('/api/get-youtube-link')) {
          const res = await fetch(url);
          const data = await res.json();
          if (data && data.url) {
            targetUrl = data.url;
          } else {
             setFetchedSizes(prev => ({ ...prev, [url]: "Size Unknown" }));
             return;
          }
        }
        
        const proxyUrl = targetUrl.startsWith('/api/') ? targetUrl : \`/api/proxy-download?url=\${encodeURIComponent(targetUrl)}&filename=media\`;
        const res = await fetch(proxyUrl, { method: 'HEAD' });
        const len = res.headers.get('content-length') || res.headers.get('estimated-content-length');
        if (len) {
          const bytes = parseInt(len, 10);
          if (bytes > 0) {
            const formatted = formatBytes(bytes);
            if (formatted) {
              setFetchedSizes(prev => ({ ...prev, [url]: formatted }));
              return;
            }
          }
        }
        setFetchedSizes(prev => ({ ...prev, [url]: "Size Unknown" }));
      } catch (err) {
        setFetchedSizes(prev => ({ ...prev, [url]: "Size Unknown" }));
      }
    };

    list.forEach(q => {
      if (q.url && !q.size && !fetchedSizes[q.url]) {
         fetchSize(q.url);
      }
    });

    if (result.media && Array.isArray(result.media)) {
      result.media.forEach((item: any) => {
        if (item.url && !fetchedSizes[item.url]) {
           fetchSize(item.url);
        }
      });
    }
  }, [result]);`;

if (code.includes('const [fetchedSizes, setFetchedSizes] = useState<Record<string, string>>({});')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Updated App.tsx fetchedSizes logic");
} else {
    console.log("Could not find target in App.tsx");
}
