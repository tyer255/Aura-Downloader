const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFetch = `export async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 20000,
  maxRetries: number = 2
): Promise<Response> {
  let attempt = 0;
  let lastError: any = null;

  // Wake up SW or dormant network socket before starting
  prewarmBackendConnection();

  while (attempt <= maxRetries) {
    attempt++;
    // For attempt 1, use a snappy 6.5s timeout so if PWA/Chrome connection was dormant, it aborts quickly and retries on a fresh socket
    const currentTimeout = attempt === 1 ? Math.min(timeoutMs, 6500) : timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      try { controller.abort(); } catch(e) {}
    }, currentTimeout);

    try {
      const sep = url.includes('?') ? '&' : '?';
      const cacheBustUrl = \`\${url}\${sep}_t=\${Date.now()}_a=\${attempt}_pwa=1\`;

      const res = await fetch(cacheBustUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
          ...(options.headers || {})
        }
      });

      clearTimeout(timer);

      if (res.ok) {
        return res;
      }

      if (attempt <= maxRetries && (res.status >= 500 || res.status === 408)) {
        await new Promise(r => setTimeout(r, 150));
        continue;
      }
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(\`Fetch attempt \${attempt} for \${url} failed or timed out:\`, err?.message || err);
      if (attempt <= maxRetries) {
        await new Promise(r => setTimeout(r, 150));
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error('Request timed out or failed');
}`;

const newFetch = `export async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 28000,
  maxRetries: number = 3,
  onStatusChange?: (msg: string) => void
): Promise<Response> {
  let attempt = 0;
  let lastError: any = null;

  if (onStatusChange) onStatusChange("Waking up server...");
  
  let healthAttempts = 0;
  while (healthAttempts < 25) {
    healthAttempts++;
    const hc = new AbortController();
    const ht = setTimeout(() => { try { hc.abort(); } catch(e){} }, 2500);
    try {
      const healthRes = await fetch('/api/health?_w=' + Date.now(), {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' },
        signal: hc.signal
      });
      clearTimeout(ht);
      if (healthRes.ok) {
        if (onStatusChange) onStatusChange("Preparing extraction...");
        await new Promise(r => setTimeout(r, 150));
        break;
      }
    } catch (e) {
      clearTimeout(ht);
      if (healthAttempts === 2 && onStatusChange) onStatusChange("Reconnecting...");
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  while (attempt <= maxRetries) {
    attempt++;
    const currentTimeout = timeoutMs;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      try { controller.abort(); } catch(e) {}
    }, currentTimeout);

    try {
      const sep = url.includes('?') ? '&' : '?';
      const cacheBustUrl = \`\${url}\${sep}_t=\${Date.now()}_a=\${attempt}_pwa=1\`;

      const res = await fetch(cacheBustUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
          ...(options.headers || {})
        }
      });

      clearTimeout(timer);

      if (res.ok) {
        return res;
      }

      if (attempt <= maxRetries && (res.status >= 500 || res.status === 408 || res.status === 502 || res.status === 504)) {
        if (onStatusChange) onStatusChange("Reconnecting...");
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return res;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;
      console.warn(\`Fetch attempt \${attempt} for \${url} failed or timed out:\`, err?.message || err);
      if (attempt <= maxRetries) {
        if (onStatusChange) onStatusChange("Reconnecting...");
        await new Promise(r => setTimeout(r, 1000));
      } else {
        throw err;
      }
    }
  }

  throw lastError || new Error('Request timed out or failed');
}`;

content = content.replace(oldFetch, newFetch);
fs.writeFileSync('src/App.tsx', content);
