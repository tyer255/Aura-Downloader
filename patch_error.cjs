const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace extractWithAI error handling to return the specific quota error if all fails
code = code.replace(
  /return localCheerioFallback\(htmlContent \|\| "<html><body><\/body><\/html>", url, isProfile\);/,
  `const fallbackResult = localCheerioFallback(htmlContent || "<html><body></body></html>", url, isProfile);
  if (!fallbackResult || !fallbackResult.success) {
    if (lastAiError) {
      return { success: false, message: "AI extraction failed: " + lastAiError, error: lastAiError };
    }
  }
  return fallbackResult;`
);

code = code.replace(
  'for (const modelName of modelsToTry) {',
  'let lastAiError = null;\n  for (const modelName of modelsToTry) {'
);

code = code.replace(
  'console.warn(`Model ${modelName} failed or was overloaded:`, err.message || err);',
  'console.warn(`Model ${modelName} failed or was overloaded:`, err.message || err);\n      lastAiError = err.message || String(err);'
);

fs.writeFileSync('server.ts', code);
