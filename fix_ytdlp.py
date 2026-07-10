import re
with open("server.ts", "r") as f:
    content = f.read()

target = """      if (qualities.length > 0) {
         mediaUrl = qualities[0].url; // highest quality
      }"""

replacement = """      if (qualities.length > 0) {
         mediaUrl = qualities[0].url; // highest quality
         
         const audioSourceUrl = bestAudio ? bestAudio.url : data.url;
         if (audioSourceUrl) {
            qualities.push({
               label: "MP3 Audio",
               url: `/api/proxy-download?url=${encodeURIComponent(audioSourceUrl)}&filename=${encodeURIComponent(data.title || "audio")}.mp3&extractAudio=true`,
               ext: "mp3",
               size: "Audio Only"
            });
         }
      }"""

content = content.replace(target, replacement)
with open("server.ts", "w") as f:
    f.write(content)
