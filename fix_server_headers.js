import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf8');

const securityHeaders = `
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    
    // Cache static assets
    if (req.path.match(/\\.(css|js|woff2?|png|jpg|jpeg|gif|ico|svg|json)$/)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else if (req.path.startsWith('/api/')) {
      res.setHeader("Cache-Control", "no-store");
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    }
    next();
  });
`;

server = server.replace(/app\.use\(\(req, res, next\) => \{\n\s*res\.setHeader\("X-Content-Type-Options", "nosniff"\);\n\s*res\.setHeader\("X-XSS-Protection", "1; mode=block"\);\n\s*next\(\);\n\s*\}\);/, securityHeaders.trim());

fs.writeFileSync('server.ts', server);
console.log('Fixed server headers');
