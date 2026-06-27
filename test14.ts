import { execSync } from 'child_process';
import fs from 'fs';
try {
    const pwd = execSync('pwd', { encoding: 'utf8' }).trim();
    console.log("pwd is:", pwd);
    console.log("Does .cache exist?", fs.existsSync('.cache'));
} catch (e) {}
