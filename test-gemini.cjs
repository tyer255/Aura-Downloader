const { GoogleGenAI, Type } = require("@google/genai");

async function run() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const htmlContent = "<html><body>Some instagram post fake content</body></html>";
  const systemInstruction = `You are an expert Social Media scraper and metadata parser. Your job is to analyze the provided condensed HTML context of a webpage and extract direct media URLs, profile avatar/banner images, titles, and stats.
CRITICAL DIRECTIVES:
1. Locate high-quality direct download or stream URLs. Look for CDN patterns, source tags, og:video, og:image, and JSON blobs.
2. If this is a profile page (YouTube channel, Instagram user, TikTok user, Facebook profile, Pinterest profile), extract user profile information: avatar picture URL (high res), banner picture URL, display name, follower counts, bio.
3. If this is a post containing multiple images (Instagram carousel, YouTube community post, Facebook gallery), return ALL extracted media items in the "media" array.
4. If it's a video, get the highest quality .mp4 or .m3u8 stream.
5. Return the result strictly in JSON format matching the response schema. No conversational wrapper or markdown formatting.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      success: { type: Type.BOOLEAN },
      title: { type: Type.STRING },
      description: { type: Type.STRING },
      thumbnail: { type: Type.STRING },
      url: { type: Type.STRING, description: "The primary direct download URL of the video or image." },
      mediaType: { 
         type: Type.STRING, 
         description: "One of: 'video', 'image', 'profile', 'carousel'" 
       },
      media: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            url: { type: Type.STRING },
            type: { type: Type.STRING, description: "Either 'video' or 'image'" },
            thumbnail: { type: Type.STRING }
          },
          required: ["url", "type"]
        }
      },
      profile: {
        type: Type.OBJECT,
        properties: {
          username: { type: Type.STRING },
          displayName: { type: Type.STRING },
          avatarUrl: { type: Type.STRING },
          bannerUrl: { type: Type.STRING },
          bio: { type: Type.STRING },
          followers: { type: Type.STRING },
          following: { type: Type.STRING },
          postsCount: { type: Type.STRING }
        },
        required: ["username"]
      }
    },
    required: ["success"]
  };
  
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `URL: https://www.instagram.com/p/C-hQ1u4A2L1\n\nContext HTML:\n${htmlContent}`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.1
    }
  });
  console.log(result.text);
}
run();
