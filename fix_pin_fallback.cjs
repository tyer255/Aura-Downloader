const fs = require('fs');
let server = fs.readFileSync('/app/applet/server.ts', 'utf8');
server = server.replace(
`    } else if (imageUrl) {
        return {
           success: true,
           title: title || "Pinterest Image",
           thumbnail: imageUrl || "",
           url: imageUrl,
           mediaType: "image",
           media: [{ type: "image", url: imageUrl, thumbnail: imageUrl || "" }]
        };
    }`,
`    } else if (imageUrl) {
        return {
           success: true,
           title: title || "Pinterest Image",
           thumbnail: imageUrl || "",
           url: imageUrl,
           mediaType: "image",
           media: [{ type: "image", url: imageUrl, thumbnail: imageUrl || "" }],
           // Include an info message for the UI if it expects a video
           message: "Pinterest has recently blocked video extraction. If this was a video pin, only its thumbnail could be retrieved."
        };
    }`);
fs.writeFileSync('/app/applet/server.ts', server);
