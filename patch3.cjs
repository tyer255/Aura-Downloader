const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    if (r && r.status && r.result && Array.isArray(r.result) && r.result.length > 0) {
      const items: any[] = r.result;
      const media = items.map((item: any) => {
        const type = inferInstagramType(item, url);
        return { type, url: item.url, thumbnail: item.thumbnail || item.url };
      });
      const primary = media[0];
      const qualities = primary.type === "video"
        ? getFallbackQualities(primary.url, "video")
        : undefined;`;

const replacement = `    if (r && r.status && r.result && Array.isArray(r.result) && r.result.length > 0) {
      const items: any[] = r.result.filter((i: any) => i.url); // filter out empty URLs
      if (items.length === 0) throw new Error("No valid items");
      const media = items.map((item: any) => {
        const type = inferInstagramType(item, url);
        return { type, url: item.url, thumbnail: item.thumbnail || item.url };
      });
      const primary = media[0];
      const qualities = primary.type === "video"
        ? getFallbackQualities(primary.url, "video")
        : undefined;`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched filter successfully!");
} else {
  console.log("Target not found!");
}
