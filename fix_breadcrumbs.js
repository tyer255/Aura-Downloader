import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

const breadcrumbCode = `
            {/* Breadcrumbs */}
            {activeTab !== 'pinterest' && (
                <nav className={clsx("flex items-center justify-center space-x-2 mb-6 text-sm font-medium", isLight ? "text-neutral-500" : "text-neutral-400")}>
                  <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                  <span>/</span>
                  <span className={clsx(isLight ? "text-neutral-900" : "text-white")}>{activeTabData.name}</span>
                </nav>
            )}
            {/* Hero Area */}`;

app = app.replace(
    /\{\/\* Hero Area \*\/\}/,
    breadcrumbCode
);

fs.writeFileSync('src/App.tsx', app);
console.log('Breadcrumbs added');
