import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `              </div>
            </motion.div>
          </div>
        )}
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Ambient Backdrop Overlay */}`;

const replacement = `              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showHistory && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Ambient Backdrop Overlay */}`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed showHistory!");
} else {
    console.log("no match missing");
}
fs.writeFileSync('src/App.tsx', content);
