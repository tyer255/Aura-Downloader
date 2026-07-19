import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
    "          </div>\n        )}\n  const navigate = useNavigate();",
    "          </div>\n        )}\n      </AnimatePresence>\n    </motion.div>\n  );\n}\n\nexport default function DownloaderView({ routeTab }: { routeTab?: Tab }) {\n  const navigate = useNavigate();"
);

fs.writeFileSync('src/App.tsx', content);
console.log("Restored DownloaderView");
