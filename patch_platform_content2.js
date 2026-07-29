import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes("import { PlatformContent }")) {
    app = "import { PlatformContent } from './components/PlatformContent';\n" + app;
}

const targetFooter = `          </motion.div>
      </div>

      {/* Footer */}`;

const replacementFooter = `          </motion.div>
          <PlatformContent activeTab={activeTab} isLight={isLight} />
      </div>

      {/* Footer */}`;

app = app.replace(targetFooter, replacementFooter);
fs.writeFileSync('src/App.tsx', app);
console.log('Platform content patched');
