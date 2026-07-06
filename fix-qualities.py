import re

with open('server.ts', 'r') as f:
    content = f.read()

new_func = """function getFallbackQualities(url: string, mediaType: string = "video") {
  if (mediaType === "video") {
    return [
      { label: "Default Quality", url: url, ext: "mp4", size: "Video" }
    ];
  }
  return [
    { label: "Original Resolution", url: url, ext: "jpg", size: "Image" }
  ];
}"""

content = re.sub(r'function getFallbackQualities\([\s\S]*?\} \/\/ Classify URL', new_func + '\n// Classify URL', content)

with open('server.ts', 'w') as f:
    f.write(content)
