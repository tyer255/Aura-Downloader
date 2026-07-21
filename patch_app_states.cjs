const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetState = `  const [isLight, setIsLight] = useState<boolean>(false);`;
const replacementState = `  const [isLight, setIsLight] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(() => {
    return localStorage.getItem('termsAccepted') === 'true';
  });`;

if (code.includes(targetState)) {
    code = code.replace(targetState, replacementState);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched states successfully!");
} else {
    console.log("Could not find states target!");
}
