import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                </motion.div>
              )}
                    <input
                      type="text"
                      value={twitterAuthToken}`;

const replacement = `                </motion.div>
              )}
            </AnimatePresence>
            {activeTab === 'x' && (
              <div className="flex flex-col items-center w-full mb-4">
                    <input
                      type="text"
                      value={twitterAuthToken}`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed x auth token!");
} else {
    console.log("no match x auth");
}
fs.writeFileSync('src/App.tsx', content);
