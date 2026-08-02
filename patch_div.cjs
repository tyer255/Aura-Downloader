const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `         </div>
         </div>

      {/* Top Header Controls */}`;

const replace = `         </div>
         </div>
      </div>

      {/* Top Header Controls */}`;

content = content.replace(target, replace);
fs.writeFileSync('src/App.tsx', content);
