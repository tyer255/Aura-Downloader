const fs = require('fs');
let code = fs.readFileSync('src/components/SpotifyAudioPlayer.tsx', 'utf8');

// Replace resolveStream
const resolveStreamRegex = /const resolveStream = async \(\) => \{[\s\S]*?resolveStream\(\);/m;
const newResolveStream = `const resolveStream = () => {
      if (!audioUrl) return;

      if (audioUrl.startsWith('/api/spotify-resolve')) {
        setIsResolving(true);
        setIsLoading(true);
        setResolveProgress(0);
        
        try {
          const sseUrl = audioUrl + (audioUrl.includes('?') ? '&' : '?') + 'sse=true';
          const source = new EventSource(sseUrl);

          source.onmessage = (event) => {
            if (!isMounted) {
                source.close();
                return;
            }
            try {
                const data = JSON.parse(event.data);
                if (data.progress !== undefined) {
                    setResolveProgress(data.progress);
                    if (data.message) setResolveMessage(data.message);
                } else if (data.success !== undefined) {
                    source.close();
                    setIsResolving(false);
                    if (data.success && data.url) {
                        setResolvedUrl(data.url);
                        setIsLoading(false);
                        setIsPlaying(true); // Auto-play when ready
                    } else {
                        setResolvedUrl(\`\${audioUrl}&stream=true\`);
                        setIsLoading(false);
                    }
                }
            } catch(e) {}
          };

          source.onerror = () => {
            source.close();
            if (isMounted) {
              setIsResolving(false);
              setResolvedUrl(\`\${audioUrl}&stream=true\`);
              setIsLoading(false);
            }
          };
          
          return () => source.close();
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
    };

    const cleanupSSE = resolveStream();`;
    
code = code.replace(resolveStreamRegex, newResolveStream);

// Fix unmount cleanup
code = code.replace(
  'return () => {\n      isMounted = false;\n    };\n  }, [audioUrl, compact]);',
  'return () => {\n      isMounted = false;\n      if (typeof cleanupSSE === "function") cleanupSSE();\n    };\n  }, [audioUrl, compact]);'
);

// Remove fake progress timer
const fakeProgressRegex = /\/\/ Handle fake progress animation during resolving[\s\S]*?\}, \[isResolving, resolvedUrl\]\);/m;
code = code.replace(fakeProgressRegex, `// Removed fake progress animation in favor of real SSE progress`);

fs.writeFileSync('src/components/SpotifyAudioPlayer.tsx', code);
console.log("Patched resolveStream for real SSE progress");
