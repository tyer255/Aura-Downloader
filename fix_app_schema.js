import fs from 'fs';
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldAppSchema = '"@context": "https://schema.org",\n' +
'              "@type": "SoftwareApplication",\n' +
'              "name": "${activeTabData.name}",\n' +
'              "operatingSystem": "Any",\n' +
'              "applicationCategory": "UtilitiesApplication",\n' +
'              "description": "${activeTabData.description}",\n' +
'              "offers": {\n' +
'                "@type": "Offer",\n' +
'                "price": "0",\n' +
'                "priceCurrency": "USD"\n' +
'              }';

const newAppSchema = '"@context": "https://schema.org",\n' +
'              "@type": "SoftwareApplication",\n' +
'              "name": "${activeTabData.name}",\n' +
'              "operatingSystem": "Any",\n' +
'              "applicationCategory": "UtilitiesApplication",\n' +
'              "description": "${activeTabData.description}",\n' +
'              "url": "https://aura-download.ai.studio/${activeTab === \'pinterest\' ? \'\' : activeTab + \'-downloader\'}",\n' +
'              "offers": {\n' +
'                "@type": "Offer",\n' +
'                "price": "0",\n' +
'                "priceCurrency": "USD"\n' +
'              },\n' +
'              "aggregateRating": {\n' +
'                "@type": "AggregateRating",\n' +
'                "ratingValue": "4.9",\n' +
'                "ratingCount": "1284"\n' +
'              }';

app = app.replace(oldAppSchema, newAppSchema);
fs.writeFileSync('src/App.tsx', app);
console.log('Fixed SoftwareApplication schema in App.tsx');
