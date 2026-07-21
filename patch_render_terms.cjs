const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<ReloadPrompt isLight={isLight} />
      <NotificationRequest isLight={isLight} />`;
const replacement = `<ReloadPrompt isLight={isLight} />
      <NotificationRequest isLight={isLight} />
      <TermsModal 
        isOpen={showTermsModal} 
        isLight={isLight}
        onAccept={() => {
          localStorage.setItem('termsAccepted', 'true');
          setHasAcceptedTerms(true);
          setShowTermsModal(false);
        }}
        onDecline={() => {
          window.location.href = "about:blank";
        }}
      />`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched render terms successfully!");
} else {
    console.log("Could not find render terms target!");
}
