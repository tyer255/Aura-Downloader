const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const [fetchedSizes, setFetchedSizes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!result) return;
    const list = sanitizeQualities(result.qualities, result.url);`;

const replacement = `  const [fetchedSizes, setFetchedSizes] = useState<Record<string, string>>({});
  const fetchingRefs = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!result) {
       fetchingRefs.current.clear();
       return;
    }
    const list = sanitizeQualities(result.qualities, result.url);`;

const target2 = `        const fetchSize = async (url: string) => {
      if (!url || fetchedSizes[url]) return;
      
      try {`;

const replacement2 = `        const fetchSize = async (url: string) => {
      if (!url || fetchedSizes[url] || fetchingRefs.current.has(url)) return;
      fetchingRefs.current.add(url);
      
      try {`;

code = code.replace(target, replacement).replace(target2, replacement2);
fs.writeFileSync('src/App.tsx', code);
console.log("Updated App.tsx to use fetchingRefs");
