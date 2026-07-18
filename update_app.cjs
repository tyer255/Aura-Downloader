const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/App.tsx', 'utf8');
code = code.replace("import { About, Contact, FAQ, CookiePolicy, DMCA, NotFound, ServerError } from './pages/StaticPages';", "import { About, Contact, FAQ, CookiePolicy, DMCA, NotFound, ServerError, PrivacyPolicy, TermsConditions } from './pages/StaticPages';");
code = code.replace("<Route path=\"/privacy-policy\" element={<CookiePolicy />} />", "<Route path=\"/privacy-policy\" element={<PrivacyPolicy />} />");
code = code.replace("<Route path=\"/terms\" element={<CookiePolicy />} />", "<Route path=\"/terms\" element={<TermsConditions />} />");
fs.writeFileSync('/app/applet/src/App.tsx', code);
