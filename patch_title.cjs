const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');

const oldEffect = `  React.useEffect(() => {
    // Only parse query params ONCE on initial load
    const params = new URLSearchParams(window.location.search);
    const initialUrl = params.get('url');
    const initialTab = params.get('tab') as Tab;
    
    if (initialTab && TABS.some(t => t.id === initialTab)) {
       setActiveTab(initialTab);
    }
    
    if (initialUrl) {
      let finalUrl = initialUrl;
      try {
        finalUrl = decodeURIComponent(initialUrl);
      } catch(e) {}
      
      const platform = detectPlatformFromUrl(finalUrl);
      if (platform) {
        setActiveTab(platform);
      }
      setUrl(finalUrl);
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);`;

const newEffect = `  React.useEffect(() => {
    const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0];
    document.title = activeTabData.title;
  }, [activeTab]);

  React.useEffect(() => {
    // Only parse query params ONCE on initial load
    const params = new URLSearchParams(window.location.search);
    const initialUrl = params.get('url');
    const initialTab = params.get('tab') as Tab;
    
    if (initialTab && TABS.some(t => t.id === initialTab)) {
       setActiveTab(initialTab);
    }
    
    if (initialUrl) {
      let finalUrl = initialUrl;
      try {
        finalUrl = decodeURIComponent(initialUrl);
      } catch(e) {}
      
      const platform = detectPlatformFromUrl(finalUrl);
      if (platform) {
        setActiveTab(platform);
      }
      setUrl(finalUrl);
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);`;

if (appCode.includes(oldEffect)) {
    appCode = appCode.replace(oldEffect, newEffect);
    fs.writeFileSync('src/App.tsx', appCode);
    console.log("Title effect patched successfully!");
} else {
    console.log("Could not find title effect.");
}
