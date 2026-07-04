import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const reqUrl = new URL(req.url);
    const fileUrl = reqUrl.searchParams.get("url");
    const customFilename = reqUrl.searchParams.get("filename") || "download";
    const inline = reqUrl.searchParams.get("inline") === "true";

    if (!fileUrl) {
      return new Response("URL parameter is required", {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Bypass proxy for Cobalt tunnel URLs — they already have CORS + Content-Disposition
    if (fileUrl.includes("/tunnel?id=")) {
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: fileUrl },
      });
    }

    const response = await fetch(fileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        Accept: "*/*",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, {
        status: response.status,
        headers: corsHeaders,
      });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const contentLength = response.headers.get("content-length");

    let ext = "mp4";
    const ct = contentType.toLowerCase();
    if (ct.includes("image/jpeg") || ct.includes("image/jpg")) ext = "jpg";
    else if (ct.includes("image/png")) ext = "png";
    else if (ct.includes("image/gif")) ext = "gif";
    else if (ct.includes("audio/mpeg") || ct.includes("audio/mp3")) ext = "mp3";
    else if (ct.includes("video/webm")) ext = "webm";
    else if (ct.includes("video/quicktime")) ext = "mov";

    let filename = customFilename;
    if (!filename.includes(".")) filename = `${filename}.${ext}`;
    filename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");

    const responseHeaders: Record<string, string> = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Content-Disposition": inline ? "inline" : `attachment; filename="${filename}"`,
    };

    if (contentLength) responseHeaders["Content-Length"] = contentLength;

    return new Response(response.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
