import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Replace synchronous import with React.lazy
const syncImport = "import { PrivacyPolicy, TermsConditions, DMCA, About, Contact, FAQ, NotFound, ServerError, CookiePolicy } from './pages/StaticPages';";

const lazyImports = `
import { Suspense, lazy } from 'react';
const PrivacyPolicy = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.PrivacyPolicy })));
const TermsConditions = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.TermsConditions })));
const DMCA = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.DMCA })));
const About = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.About })));
const Contact = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Contact })));
const FAQ = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.FAQ })));
const NotFound = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.NotFound })));
const ServerError = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.ServerError })));
const CookiePolicy = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.CookiePolicy })));
`;

app = app.replace(syncImport, lazyImports);

// Wrap Routes with Suspense
app = app.replace(
  /<Routes>/,
  '<Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>\n    <Routes>'
);

app = app.replace(
  /<\/Routes>/,
  '</Routes>\n    </Suspense>'
);

fs.writeFileSync('src/App.tsx', app);
console.log('Lazy loading added');
