const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix the malformed img tags
content = content.replace(/\/\s*loading="lazy" decoding="async" width="400" height="400">/g, ' loading="lazy" decoding="async" width="400" height="400" />');

// also some tags were multiline so the regex didn't match. 
// For <img ... />
content = content.replace(/<img\s([^>]+)>/g, (match, attrs) => {
  if (match.includes('loading="lazy"')) return match; // already handled
  let newAttrs = attrs;
  if (newAttrs.endsWith('/')) {
    newAttrs = newAttrs.slice(0, -1).trim();
  }
  if (!newAttrs.includes('loading=')) newAttrs += ' loading="lazy"';
  if (!newAttrs.includes('decoding=')) newAttrs += ' decoding="async"';
  if (!newAttrs.includes('width=')) newAttrs += ' width="400"';
  if (!newAttrs.includes('height=')) newAttrs += ' height="400"';
  return `<img ${newAttrs} />`;
});

// For accessibility on icon-only buttons
// I will manually add aria-label for known buttons if they don't have them
// Or I can add them via regex. Let's do a few passes.
content = content.replace(/<button([^>]*)>\s*<X\s/g, (match, p1) => {
  if (p1.includes('aria-label=')) return match;
  return `<button aria-label="Close"${p1}>\n                <X `;
});

content = content.replace(/<button([^>]*)>\s*<ChevronLeft\s/g, (match, p1) => {
  if (p1.includes('aria-label=')) return match;
  return `<button aria-label="Previous"${p1}>\n                <ChevronLeft `;
});

content = content.replace(/<button([^>]*)>\s*<ChevronRight\s/g, (match, p1) => {
  if (p1.includes('aria-label=')) return match;
  return `<button aria-label="Next"${p1}>\n                <ChevronRight `;
});

content = content.replace(/<button([^>]*)>\s*<Maximize2\s/g, (match, p1) => {
  if (p1.includes('aria-label=')) return match;
  return `<button aria-label="Maximize"${p1}>\n                <Maximize2 `;
});

content = content.replace(/<button([^>]*)>\s*<Moon\s/g, (match, p1) => {
  if (p1.includes('aria-label=')) return match;
  return `<button aria-label="Toggle dark mode"${p1}>\n            <Moon `;
});

content = content.replace(/<button([^>]*)>\s*\{isLight\s\?\s<Moon/g, (match, p1) => {
  if (p1.includes('aria-label=')) return match;
  return `<button aria-label="Toggle theme"${p1}>\n            {isLight ? <Moon`;
});

content = content.replace(/<button([^>]*)>\s*<History\s/g, (match, p1) => {
  if (p1.includes('aria-label=')) return match;
  return `<button aria-label="View history"${p1}>\n            <History `;
});

content = content.replace(/<button([^>]*)>\s*<Trash2\s/g, (match, p1) => {
  if (p1.includes('aria-label=')) return match;
  return `<button aria-label="Clear all history"${p1}>\n                          <Trash2 `;
});


fs.writeFileSync('src/App.tsx', content);
