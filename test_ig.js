import fs from 'fs';

async function testIGSources(shortcode) {
  console.log("==========================================");
  console.log("Testing Instagram shortcode:", shortcode);
  console.log("==========================================");

  // 1. Test ddinstagram / vxinstagram API
  try {
    const vxUrl = `https://api.vxinstagram.com/p/${shortcode}`;
    const res = await fetch(vxUrl, { headers: { "User-Agent": "TelegramBot" } });
    console.log("vxinstagram status:", res.status);
    if (res.ok) {
      const json = await res.json();
      console.log("vxinstagram JSON keys:", Object.keys(json));
      if (json.media_list) console.log("vxinstagram media_list count:", json.media_list.length);
    }
  } catch(e) {
    console.log("vxinstagram error:", e.message);
  }

  // 2. Test ddinstagram.com / instagram JSON endpoints
  try {
    const ddUrl = `https://ddinstagram.com/p/${shortcode}`;
    const res = await fetch(ddUrl, { headers: { "User-Agent": "TelegramBot (like TwitterBot)" } });
    console.log("ddinstagram status:", res.status);
    if (res.ok) {
      const html = await res.text();
      console.log("ddinstagram HTML length:", html.length);
      const ogImages = [...html.matchAll(/property="og:image"\s*content="([^"]+)"/g)].map(m => m[1]);
      const ogVideos = [...html.matchAll(/property="og:video"\s*content="([^"]+)"/g)].map(m => m[1]);
      console.log("ddinstagram og:image count:", ogImages.length, "og:video count:", ogVideos.length);
    }
  } catch(e) {
    console.log("ddinstagram error:", e.message);
  }

  // 3. Test Instagram GraphQL with doc_id 17888483320088557 or query_hash 2b38d4e703720646083e20e83ef59392
  try {
    const gqlUrl = `https://www.instagram.com/graphql/query/?query_hash=2b38d4e703720646083e20e83ef59392&variables=${encodeURIComponent(JSON.stringify({shortcode: shortcode}))}`;
    const res = await fetch(gqlUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "X-IG-App-ID": "936619743392459",
        "Accept": "*/*"
      }
    });
    console.log("GraphQL query_hash status:", res.status);
    if (res.ok) {
      const json = await res.json();
      const media = json?.data?.shortcode_media;
      console.log("GraphQL shortcode_media type:", media?.__typename);
      const edges = media?.edge_sidecar_to_children?.edges;
      console.log("GraphQL sidecar count:", edges?.length);
    }
  } catch(e) {
    console.log("GraphQL query_hash error:", e.message);
  }

  // 4. Test Instagram Mobile API endpoint with various headers
  try {
    const mobileUrl = `https://i.instagram.com/api/v1/media/${shortcode}/info/`;
    const res = await fetch(mobileUrl, {
      headers: {
        "User-Agent": "Instagram 219.0.0.12.117 Android (29/10; 480dpi; 1080x2260; HUAWEI/HONOR; BKL-L09; BKL-L09; hi3670; en_US; 341121115)",
        "X-IG-App-ID": "936619743392459"
      }
    });
    console.log("Mobile info status:", res.status);
    if (res.ok) {
      const json = await res.json();
      const items = json?.items;
      console.log("Mobile info items count:", items?.length, "carousel_media count:", items?.[0]?.carousel_media?.length);
    }
  } catch(e) {
    console.log("Mobile info error:", e.message);
  }

  // 5. Test RapidAPI if RAPIDAPI_KEY is available
  const rapidKey = process.env.RAPIDAPI_KEY || process.env.RAPID_API_KEY;
  if (rapidKey) {
    console.log("Testing RapidAPI with key present...");
    try {
      const host = "instagram-scraper-api2.p.rapidapi.com";
      const rapidUrl = `https://${host}/v1/post_info?code_or_id_or_url=${encodeURIComponent(shortcode)}`;
      const res = await fetch(rapidUrl, {
        headers: {
          "x-rapidapi-key": rapidKey,
          "x-rapidapi-host": host
        }
      });
      console.log("RapidAPI status:", res.status);
      if (res.ok) {
        const json = await res.json();
        const item = json?.data?.items?.[0] || json?.items?.[0] || json?.data;
        const car = item?.carousel_media || item?.edge_sidecar_to_children?.edges;
        console.log("RapidAPI carousel count:", car?.length);
      }
    } catch(e) {
      console.log("RapidAPI error:", e.message);
    }
  } else {
    console.log("No RAPIDAPI_KEY in environment.");
  }
}

async function main() {
  await testIGSources("C3x-Z2_S0gY");
}

main();
