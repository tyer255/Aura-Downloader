const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetDestroy = `      onDestroyStarted: () => {
        localStorage.setItem('hasSeenTour', 'true');
        setResult(null);
        driverObj.destroy();
      }`;

const replacementDestroy = `      onDestroyStarted: () => {
        localStorage.setItem('hasSeenTour', 'true');
        setResult(null);
        driverObj.destroy();
        
        // After tour completes, show terms modal if they haven't accepted
        if (!localStorage.getItem('termsAccepted')) {
          setShowTermsModal(true);
        }
      }`;

code = code.replace(targetDestroy, replacementDestroy);

const targetEffect = `  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setTimeout(() => {
        startTour();
      }, 1000);
    }
  }, []);`;

const replacementEffect = `  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setTimeout(() => {
        startTour();
      }, 1000);
    } else {
      // If they have already seen the tour but haven't accepted terms (returning user before this feature was added)
      if (!localStorage.getItem('termsAccepted')) {
        setShowTermsModal(true);
      }
    }
  }, []);`;

code = code.replace(targetEffect, replacementEffect);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched tour terms logic successfully!");
