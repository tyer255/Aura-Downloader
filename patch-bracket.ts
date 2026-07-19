import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            </div>
          </motion.div>
        )}
      </div>`;

const replacement = `            </div>
          </motion.div>
      </div>`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    console.log("Matched and fixed bracket!");
} else {
    console.log("no match bracket");
}
fs.writeFileSync('src/App.tsx', content);
