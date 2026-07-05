const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// I didn't add the closing `</>` before.
content = content.replace(/(return\s*\(\s*)<div className=\{clsx\(\s*"min-h-screen/m, '$1<>\n      <Helmet>\n        <title>{activeTabData.name} | Social Downloader</title>\n        <meta name="description" content={activeTabData.description} />\n        <meta property="og:title" content={`\\${activeTabData.name} | Social Downloader`} />\n        <meta property="og:description" content={activeTabData.description} />\n        <meta property="og:type" content="website" />\n        <meta name="twitter:card" content="summary_large_image" />\n      </Helmet>\n      <div className={clsx(\n        "min-h-screen');

// We also need to find the end of DownloaderView and add `</>`.
// DownloaderView ends right before `export default function App() {`
content = content.replace(/(\s*)(export default function App\(\) {)/, '$1</>\n    );\n  }\n$2');
// Wait, the original code had:
//   return (
//     <div ...>
//       ...
//     </div>
//   );
// }
// We can just replace `    </div>\n  );\n}\n\nexport default function App()` with `    </div>\n    </>\n  );\n}\n\nexport default function App()`
// Actually, let's just do it cleanly.

content = content.replace(/<\/div>\n\s*\);\n\}/g, '</div>\n    </>\n  );\n}');

fs.writeFileSync('src/App.tsx', content);
