import re
with open("server.ts", "r") as f:
    content = f.read()

target = """function getFallbackQualities(url: string, mediaType: string = "video") {
  if (mediaType === "video") {
    return [
      { label: "1080p (Full HD)", url: url, ext: "mp4", size: "High Definition" },
      { label: "720p (HD Video)", url: url, ext: "mp4", size: "Standard HD" },
      { label: "480p (SD Video)", url: url, ext: "mp4", size: "Standard Definition" },
      { label: "360p (Mobile Video)", url: url, ext: "mp4", size: "Low Bandwidth" }
    ];
  }"""

replacement = """function getFallbackQualities(url: string, mediaType: string = "video") {
  if (mediaType === "video") {
    const mp3Url = `/api/proxy-download?url=${encodeURIComponent(url)}&filename=audio.mp3&extractAudio=true`;
    return [
      { label: "1080p (Full HD)", url: url, ext: "mp4", size: "High Definition" },
      { label: "720p (HD Video)", url: url, ext: "mp4", size: "Standard HD" },
      { label: "480p (SD Video)", url: url, ext: "mp4", size: "Standard Definition" },
      { label: "360p (Mobile Video)", url: url, ext: "mp4", size: "Low Bandwidth" },
      { label: "MP3 Audio", url: mp3Url, ext: "mp3", size: "Audio Only" }
    ];
  }"""

content = content.replace(target, replacement)
with open("server.ts", "w") as f:
    f.write(content)
