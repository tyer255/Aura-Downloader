const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

const target = `    const resolveStream = async () => {
      if (!audioUrl) return;
      if (audioUrl.startsWith('/api/spotify-resolve')) {
        setIsResolving(true);
        try {
          const res = await fetch(audioUrl);
          const data = await res.json();
          if (isMounted) {
            setIsResolving(false);
            if (data.success && data.url) {
              setResolvedUrl(data.url);
            } else {
              setResolvedUrl(\`\${audioUrl}&stream=true\`);
            }
          }
        } catch (e) {
          if (isMounted) {
            setIsResolving(false);
            setResolvedUrl(\`\${audioUrl}&stream=true\`);
          }
        }
      } else {
        setResolvedUrl(audioUrl);
      }
    };`;

const replacement = `    const resolveStream = async () => {
      if (!audioUrl) return;
      if (audioUrl.startsWith('/api/spotify-resolve')) {
        setIsResolving(true);
        try {
          const res = await fetch(audioUrl);
          const data = await res.json();
          if (isMounted) {
            setIsResolving(false);
            if (data.success && data.url) {
              setResolvedUrl(data.url);
              setIsLoading(false);
            } else {
              setResolvedUrl(\`\${audioUrl}&stream=true\`);
              setIsLoading(false);
            }
          }
        } catch (e) {
          if (isMounted) {
            setIsResolving(false);
            setResolvedUrl(\`\${audioUrl}&stream=true\`);
            setIsLoading(false);
          }
        }
      } else {
        setResolvedUrl(audioUrl);
        setIsLoading(false);
      }
    };`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
  console.log("Patched resolveStream!");
} else {
  console.log("Not found!");
}
