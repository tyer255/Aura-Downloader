import re

with open("server.ts", "r") as f:
    content = f.read()

target = '''      if (isProfile) {
        console.log("Profile URL detected, bypassing media extractors and using AI extraction directly.");
        const aiResult = await extractWithAI(trimmedUrl, true);
        if (aiResult && aiResult.success) {
          return res.json(aiResult);
        } else {
           // fallback to other extractors if AI profile extraction fails completely
        }
      }'''

replacement = '''      if (isProfile) {
        if (platform === 'youtube') {
           console.log("YouTube Profile URL detected, extracting with yt-dlp flat-playlist.");
           const ytDlpResult = await extractWithYtDlp(trimmedUrl, true);
           if (ytDlpResult && ytDlpResult.success) {
             return res.json(ytDlpResult);
           }
        } else {
          console.log("Profile URL detected, bypassing media extractors and using AI extraction directly.");
          const aiResult = await extractWithAI(trimmedUrl, true);
          if (aiResult && aiResult.success) {
            return res.json(aiResult);
          } else {
             // fallback to other extractors if AI profile extraction fails completely
          }
        }
      }'''

if target in content:
    content = content.replace(target, replacement)
    with open("server.ts", "w") as f:
        f.write(content)
    print("Replaced bypass successfully")
else:
    print("Target bypass not found")
