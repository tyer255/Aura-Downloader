const fs = require('fs');
let staticPages = fs.readFileSync('src/pages/StaticPages.tsx', 'utf-8');

const cookiePolicyComponent = `
export function CookiePolicy() {
  const theme = useThemeState();
  return (
    <StaticPageView title="Cookie Policy" {...theme}>
      <h2 className="text-xl font-bold mb-4 mt-6">1. What are Cookies?</h2>
      <p className="mb-4">Cookies are small text files that are stored on your device when you visit a website. They are widely used to make websites work or improve their efficiency, as well as to provide information to the owners of the site.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">2. How We Use Cookies</h2>
      <p className="mb-4">Our service relies on local storage rather than traditional tracking cookies. We use local storage strictly for functional reasons, such as saving your theme preference (Light/Dark mode) and keeping track of your recent downloads locally on your browser.</p>
      
      <h2 className="text-xl font-bold mb-4 mt-6">3. Third-Party Cookies</h2>
      <p className="mb-4">We do not use any third-party tracking, advertising, or analytics cookies on this platform. Your data remains private and is not shared with external services.</p>
    </StaticPageView>
  );
}
`;
staticPages += cookiePolicyComponent;
fs.writeFileSync('src/pages/StaticPages.tsx', staticPages);

let app = fs.readFileSync('src/App.tsx', 'utf-8');
app = app.replace("import { PrivacyPolicy, TermsConditions, DMCA, About, Contact, FAQ, NotFound, ServerError }", "import { PrivacyPolicy, TermsConditions, DMCA, About, Contact, FAQ, NotFound, ServerError, CookiePolicy }");
app = app.replace('<Route path="*" element={<NotFound />} />', '<Route path="/cookie-policy" element={<CookiePolicy />} />\n      <Route path="*" element={<NotFound />} />');
app = app.replace('<Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Privacy Policy</Link>', '<Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Privacy Policy</Link>\n            <Link to="/cookie-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Cookie Policy</Link>');

// Also update the footer in StaticPageView
let staticPageView = fs.readFileSync('src/components/StaticPageView.tsx', 'utf-8');
staticPageView = staticPageView.replace('<Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Privacy Policy</Link>', '<Link to="/privacy-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Privacy Policy</Link>\n                <Link to="/cookie-policy" className={isLight ? "text-neutral-600 hover:text-neutral-900" : "text-neutral-400 hover:text-white"}>Cookie Policy</Link>');
fs.writeFileSync('src/components/StaticPageView.tsx', staticPageView);

fs.writeFileSync('src/App.tsx', app);
