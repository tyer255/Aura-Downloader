const { execSync } = require('child_process');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log("No TypeScript errors.");
} catch (e) {
  console.log("TypeScript errors found.");
}
