        if (rapidKey) {
            try {
                const rapidResult = await extractTwitterRapidAPI(trimmedUrl, rapidKey);
                if (rapidResult && rapidResult.media && rapidResult.media.length > 0) {
                    return res.json({ success: true, ...rapidResult });
                }
            } catch (err: any) {
                // If we get a subscription error, send it to the UI!
                if (err.message.includes("subscribed")) {
                     return res.status(500).json({ success: false, message: err.message });
                }
            }
        }

        const authToken = process.env.TWITTER_AUTH_TOKEN || req.body.twitterAuthToken || "";
        const xtractorResult = await extractTwitterXtractor(trimmedUrl, authToken);
        
        if (xtractorResult && xtractorResult.media && xtractorResult.media.length > 0) {
            return res.json({ success: true, ...xtractorResult });
        } else {
            let msg = "Twitter blocked our server IP. ";
            if (rapidKey) {
                 msg += "We tried RapidAPI but it failed. Please ensure you are subscribed to the 'Twitter135' API on RapidAPI (it's free).";
            } else {
                 msg += "To fix this, add your RAPIDAPI_KEY to AI Studio Secrets and subscribe to 'Twitter135' on RapidAPI, OR set your TWITTER_AUTH_TOKEN.";
            }
            return res.status(500).json({ success: false, message: msg });
        }
      }
      } else {
        if (platform === 'pinterest') {
            console.log("Trying native extractor for Pinterest...");
            
            // Resolve pin.it URLs first so fallbacks can use the real URL
            let resolvedUrl = trimmedUrl;
            if (trimmedUrl.includes('pin.it')) {
                try {
                    const resp = await fetch(trimmedUrl); // Follows redirects natively if possible
                    let finalUrl = resp.url;
                    
                    if (finalUrl === trimmedUrl) {
                        // Might be a meta refresh
                        const text = await resp.text();
                        const metaMatch = text.match(/<meta\s+http-equiv="refresh"\s+content="\d+;\s*url=([^"]+)"/i) || 
                                          text.match(/href="([^"]+api\.pinterest\.com\/url_shortener[^"]+)"/i);
                        if (metaMatch && metaMatch[1]) {
                            finalUrl = metaMatch[1];
                        }
                    }
                    
                    if (finalUrl.includes('api.pinterest.com/url_shortener')) {
                         const redirectResp = await fetch(finalUrl, { redirect: 'manual' });
                         if (redirectResp.status >= 300 && redirectResp.status < 400) {
                            finalUrl = redirectResp.headers.get('location') || finalUrl;
                         } else {
                            // If it's a 200, maybe another meta refresh
                            const text = await redirectResp.text();
                            const metaMatch = text.match(/<meta\s+http-equiv="refresh"\s+content="\d+;\s*url=([^"]+)"/i);
                            if (metaMatch && metaMatch[1]) finalUrl = metaMatch[1];
                         }
                    }
                    
                    resolvedUrl = finalUrl;
                } catch(e) {}
            }
            trimmedUrl = resolvedUrl;
            
            const nativeResult = await extractPinterestNative(trimmedUrl);
            if (nativeResult && nativeResult.success && nativeResult.mediaType === 'video') {
                return res.json(nativeResult);
            }
            console.log("Trying yt-dlp for Pinterest...");
            const ytResult = await extractWithYtDlp(trimmedUrl);
            if (ytResult && ytResult.success && ytResult.mediaType === 'video') {
                return res.json(ytResult);
            }
            console.log("yt-dlp did not return a video, trying btch-downloader for Pinterest...");
            const pinResult = await extractPinterestBtch(trimmedUrl);
            if (pinResult && pinResult.success) {
                return res.json(pinResult);
            }
            if (ytResult && ytResult.success) {
                return res.json(ytResult);
            }
            if (nativeResult && nativeResult.success) {
                return res.json(nativeResult);
            }
        } else if (platform === 'youtube') {
            console.log("YouTube direct extraction requested.");
            const vredenResult = await extractWithVreden(trimmedUrl);
            if (vredenResult && vredenResult.success) {
                return res.json(vredenResult);
            }
            console.log("Vreden extraction failed, trying local YT-DLP...");
            const ytDlpResult = await extractWithYtDlp(trimmedUrl);
            if (ytDlpResult && ytDlpResult.success) {
                return res.json(ytDlpResult);
            }
            console.log("YouTube specialized extractors failed, continuing to fallbacks...");
        }
        
        if (trimmedUrl.includes("instagram.com") || trimmedUrl.includes("instagr.am")) {
           console.log("Trying Instagram RapidAPI...");
           const rapidResult = await extractInstagramRapidAPI(trimmedUrl);
           if (rapidResult && rapidResult.success) {
               return res.json(rapidResult);
           }
           
           console.log("Trying Instagram RepoBackend...");
           const repoResult = await extractInstagramRepoBackend(trimmedUrl);
           if (repoResult && repoResult.success) {
               return res.json(repoResult);
           }

           const btchResult = await extractInstagramBtch(trimmedUrl);
           if (btchResult && btchResult.success) {
               return res.json(btchResult);
           }
        }
        
        console.log("Trying Cobalt API...");
        const cobaltResult = await extractWithCobalt(trimmedUrl);
        if (cobaltResult && cobaltResult.success) {
           return res.json(cobaltResult);
        }
        
        if (platform === 'youtube') {
           console.log("Trying Vreden YTmp4 fallback...");
           const vredenResult = await extractWithVreden(trimmedUrl);
           if (vredenResult && vredenResult.success) return res.json(vredenResult);
        } else if (platform === 'x' || lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
           console.log("Trying Twitter RapidAPI...");
           const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
           if (rapidKey) {
               try {
                   const rapidResult = await extractTwitterRapidAPI(trimmedUrl, rapidKey);
                   if (rapidResult && rapidResult.media && rapidResult.media.length > 0) {
                       return res.json({ success: true, ...rapidResult });
                   }
               } catch (e: any) { }
           }
           console.log("Trying Twitter Xtractor...");
           const authToken = process.env.TWITTER_AUTH_TOKEN || req.body.twitterAuthToken || "";
           const xtractorResult = await extractTwitterXtractor(trimmedUrl, authToken);
           if (xtractorResult && xtractorResult.media && xtractorResult.media.length > 0) {
               return res.json({ success: true, ...xtractorResult });
           }
        }

        console.log("Trying YT-DLP fallback...");
        const ytDlpResult = await extractWithYtDlp(trimmedUrl);
