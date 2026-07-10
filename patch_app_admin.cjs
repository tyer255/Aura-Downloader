const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const importAdmin = `import { AdminModal } from './components/AdminModal';\n`;
code = importAdmin + code;

const adminState = `
  const [isAdminOpen, setIsAdminOpen] = useState(false);
`;
code = code.replace(/const \[activeTab, setActiveTab\] = useState<Tab>\(routeTab \|\| 'pinterest'\);/, "const [activeTab, setActiveTab] = useState<Tab>(routeTab || 'pinterest');" + adminState);

const adminButton = `
        <button onClick={() => setIsAdminOpen(true)} className="ml-auto flex items-center justify-center p-2 rounded-full bg-neutral-200/50 hover:bg-neutral-300/50 dark:bg-white/5 dark:hover:bg-white/10 transition-colors">
          <Settings className="w-5 h-5 opacity-70 hover:opacity-100" />
        </button>
`;
code = code.replace(/\{\/\* Top Header \*\/\}\n\s+<div className="w-full max-w-2xl flex flex-row items-center justify-between mb-8 sm:mb-16 relative z-20 gap-2 overflow-x-auto no-scrollbar">/, 
`{/* Top Header */}
      <div className="w-full max-w-2xl flex flex-row items-center justify-between mb-8 sm:mb-16 relative z-20 gap-2 overflow-x-auto no-scrollbar">` + adminButton);

const adminModalRender = `
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
`;
code = code.replace(/<LazyMotion features=\{domMax\}>/, "<LazyMotion features={domMax}>\n" + adminModalRender);

// Also need to import Settings from lucide-react if not imported.
// App.tsx probably has many imports from lucide-react, including Settings.
// Let's check if Settings is imported.

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with Admin button.");
