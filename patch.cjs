const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /      \} else \{\n        if \(platform === 'pinterest'\) \{([\s\S]*?)      \}          \n    \} catch \(error\) \{/g;

const replacement = `      } else {
        const racePromises = [];
        
        racePromises.push(extractWithCobalt(trimmedUrl));

        if (platform === 'pinterest') {
            console.log("Adding Pinterest extractors...");
            let resolvedUrl = trimmedUrl;
            if (trimmedUrl.includes('pin.it')) {
                try {
                    const resp = await fetch(trimmedUrl);
                    let finalUrl = resp.url;
                    if (finalUrl === trimmedUrl) {
                        const text = await resp.text();
                        const metaMatch = text.match(/<meta\\s+http-equiv="refresh"\\s+content="\\d+;\\s*url=([^"]+)"/i) || text.match(/href="([^"]+api\\.pinterest\\.com\\/url_shortener[^"]+)"/i);
                        if (metaMatch && metaMatch[1]) finalUrl = metaMatch[1];
                    }
                    if (finalUrl.includes('api.pinterest.com/url_shortener')) {
                         const redirectResp = await fetch(finalUrl, { redirect: 'manual' });
                         if (redirectResp.status >= 300 && redirectResp.status < 400) {
                            finalUrl = redirectResp.headers.get('location') || finalUrl;
                         } else {
                            const text = await redirectResp.text();
                            const metaMatch = text.match(/<meta\\s+http-equiv="refresh"\\s+content="\\d+;\\s*url=([^"]+)"/i);
                            if (metaMatch && metaMatch[1]) finalUrl = metaMatch[1];
                         }
                    }
                    resolvedUrl = finalUrl;
                } catch(e) {}
            }
            trimmedUrl = resolvedUrl;
            racePromises.push(extractPinterestNative(trimmedUrl));
            racePromises.push(extractPinterestBtch(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else if (platform === 'youtube') {
            racePromises.push(extractWithVreden(trimmedUrl));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else if (trimmedUrl.includes("instagram.com") || trimmedUrl.includes("instagr.am")) {
            racePromises.push(extractInstagramRapidAPI(trimmedUrl));
            racePromises.push(extractInstagramRepoBackend(trimmedUrl));
            racePromises.push(extractInstagramBtch(trimmedUrl));
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
            const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
            if (rapidKey) racePromises.push(extractTwitterRapidAPI(trimmedUrl, rapidKey));
            const authToken = process.env.TWITTER_AUTH_TOKEN || req.body.twitterAuthToken || "";
            racePromises.push(extractTwitterXtractor(trimmedUrl, authToken));
            racePromises.push(extractWithYtDlp(trimmedUrl));
        } else {
            racePromises.push(extractWithYtDlp(trimmedUrl));
        }

        racePromises.push(extractWithAI(trimmedUrl, false));

        console.log("Racing " + racePromises.length + " extractors for speed...");
        const raceResult = await fastRace(racePromises);
        
        if (raceResult && raceResult.success) {
            return res.json(raceResult);
        }

        let errorMsg = "The media content could not be retrieved. Please verify the link is public and try again.";
        if (trimmedUrl.includes("instagram.com")) {
          if ((req as any).igManualFallback) {
             return res.status(400).json({
                success: false,
                message: "Instagram blocks automated requests. You must use the manual JSON workaround.",
               needsManualJson: true,
               url: trimmedUrl
             });
          }
          errorMsg = "Instagram blocks our cloud servers from downloading posts. Please check your RapidAPI subscription.";
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
          errorMsg = "Twitter blocked our server IP for unauthenticated requests. Add your RAPIDAPI_KEY to AI Studio Secrets and subscribe to 'Twitter135' on RapidAPI, OR set your TWITTER_AUTH_TOKEN.";
        }
        return res.status(400).json({ success: false, message: \`Extraction failed: \${errorMsg}\` });
      }
    } catch (error: any) {`;

code = code.replace(regex, replacement);
fs.writeFileSync('server.ts', code);
