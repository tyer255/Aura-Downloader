const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetToRemove = `          delete next[url];
          return next;
        });
      }, 3500);
    } catch (error: any) {
      console.error('Download setup failed:', error);
      setDownloadProgress(null);
      setActiveDownloads(prev => ({
        ...prev,
        [url]: { filename, progress: null, status: "failed" }
      }));
      setHistoryToast("Download failed.");
      setTimeout(() => setHistoryToast(null), 3000);
      showNotification("Download Failed", {
        body: \`Failed to download: \${filename}\`,
        icon: '/vite.svg'
      });
      setTimeout(() => {
        setActiveDownloads(prev => {
          const next = { ...prev };
          delete next[url];
          return next;
        });
      }, 4000);
    }
  };`;

if (code.includes(targetToRemove)) {
    code = code.replace(targetToRemove, '');
    fs.writeFileSync('src/App.tsx', code);
    console.log("Fixed App.tsx extra chunk");
} else {
    console.log("Could not find the extra chunk");
}
