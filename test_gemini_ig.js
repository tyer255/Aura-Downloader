import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch';

async function testGeminiIG(shortcode) {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing Gemini IG carousel extraction for:", shortcode);
  if (!apiKey) {
    console.log("No GEMINI_API_KEY");
    return;
  }

  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  const html = await res.text();
  console.log("Fetched embed HTML len:", html.length);

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
You are an expert Instagram data extraction system.
Analyze the following Instagram embed page HTML and extract ALL carousel items (photos and videos) contained in this post.

CRITICAL INSTRUCTIONS:
- Identify EVERY UNIQUE image or video item in the carousel (e.g., slide 1, slide 2, slide 3... up to slide 10+).
- Look for image URLs (display_url, display_resources, EmbeddedMediaImage, cdninstagram, fbcdn) and video URLs.
- Do NOT stop after 1 or 2 items. Extract ALL items.
- Return EXACTLY one item in the "media" array for each unique slide in the carousel, in order.
- Return valid HTTP/HTTPS URLs.

Return ONLY a JSON object matching this schema:
{
  "title": "string (caption/title)",
  "isCarousel": boolean,
  "media": [
    {
      "type": "image" | "video",
      "url": "string (direct media URL)",
      "thumbnail": "string (thumbnail URL)"
    }
  ]
}

HTML Content:
${html.substring(0, 500000)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    console.log("Gemini response:\n", response.text);
  } catch(e) {
    console.log("Gemini error:", e.message);
  }
}

testGeminiIG("C3x-Z2_S0gY");
