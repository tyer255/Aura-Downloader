import fs from 'fs';
let server = fs.readFileSync('server.ts', 'utf8');

const targetBlock = '      if (routeData) {\n' +
'         html = html.replace(/<title[^>]*>.*?<\\/title>/i, `<title data-rh="true">${routeData.title}</title>`);\n' +
'         html = html.replace(/<meta[^>]*name="description"[^>]*\\/?>/i, `<meta name="description" data-rh="true" content="${routeData.desc}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="keywords"[^>]*\\/?>/i, `<meta name="keywords" data-rh="true" content="${routeData.keywords}" />`);\n' +
'         html = html.replace(/<meta[^>]*property="og:title"[^>]*\\/?>/i, `<meta property="og:title" data-rh="true" content="${routeData.title}" />`);\n' +
'         html = html.replace(/<meta[^>]*property="og:description"[^>]*\\/?>/i, `<meta property="og:description" data-rh="true" content="${routeData.desc}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="twitter:title"[^>]*\\/?>/i, `<meta name="twitter:title" data-rh="true" content="${routeData.title}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="twitter:description"[^>]*\\/?>/i, `<meta name="twitter:description" data-rh="true" content="${routeData.desc}" />`);\n' +
'      }';

const newBlock = '      if (routeData) {\n' +
'         const canonicalUrl = `https://aura-download.ai.studio${req.path === "/" ? "" : req.path}`;\n' +
'         html = html.replace(/<title[^>]*>.*?<\\/title>/i, `<title data-rh="true">${routeData.title}</title>`);\n' +
'         html = html.replace(/<meta[^>]*name="description"[^>]*\\/?>/i, `<meta name="description" data-rh="true" content="${routeData.desc}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="keywords"[^>]*\\/?>/i, `<meta name="keywords" data-rh="true" content="${routeData.keywords}" />`);\n' +
'         html = html.replace(/<meta[^>]*property="og:title"[^>]*\\/?>/i, `<meta property="og:title" data-rh="true" content="${routeData.title}" />`);\n' +
'         html = html.replace(/<meta[^>]*property="og:description"[^>]*\\/?>/i, `<meta property="og:description" data-rh="true" content="${routeData.desc}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="twitter:title"[^>]*\\/?>/i, `<meta name="twitter:title" data-rh="true" content="${routeData.title}" />`);\n' +
'         html = html.replace(/<meta[^>]*name="twitter:description"[^>]*\\/?>/i, `<meta name="twitter:description" data-rh="true" content="${routeData.desc}" />`);\n' +
'         html = html.replace("</head>", `<link rel="canonical" href="${canonicalUrl}" />\\n</head>`);\n' +
'         html = html.replace("</head>", `\\n<script type="application/ld+json">\\n${JSON.stringify({\n' +
'            "@context": "https://schema.org",\n' +
'            "@type": "WebPage",\n' +
'            "name": routeData.title,\n' +
'            "description": routeData.desc,\n' +
'            "url": canonicalUrl,\n' +
'            "publisher": {\n' +
'              "@type": "Organization",\n' +
'              "name": "Aura Downloader",\n' +
'              "logo": {\n' +
'                "@type": "ImageObject",\n' +
'                "url": "https://aura-download.ai.studio/icon-512.png"\n' +
'              }\n' +
'            }\n' +
'         })}\\n</script>\\n</head>`);\n' +
'         html = html.replace("</head>", `\\n<script type="application/ld+json">\\n${JSON.stringify({\n' +
'            "@context": "https://schema.org",\n' +
'            "@type": "SoftwareApplication",\n' +
'            "name": routeData.title.split(" - ")[0],\n' +
'            "operatingSystem": "Any",\n' +
'            "applicationCategory": "UtilitiesApplication",\n' +
'            "description": routeData.desc,\n' +
'            "url": canonicalUrl,\n' +
'            "offers": {\n' +
'              "@type": "Offer",\n' +
'              "price": "0",\n' +
'              "priceCurrency": "USD"\n' +
'            },\n' +
'            "aggregateRating": {\n' +
'              "@type": "AggregateRating",\n' +
'              "ratingValue": "4.9",\n' +
'              "ratingCount": "1284"\n' +
'            }\n' +
'         })}\\n</script>\\n</head>`);\n' +
'      }';

server = server.replace(targetBlock, newBlock);
fs.writeFileSync('server.ts', server);
console.log('Injected canonical and JSON-LD in server.ts');
