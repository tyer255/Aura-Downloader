import fs from 'fs';

let pages = fs.readFileSync('src/pages/StaticPages.tsx', 'utf8');

// Ensure Helmet is imported
if (!pages.includes('import { Helmet }')) {
    pages = "import { Helmet } from 'react-helmet-async';\n" + pages;
}

const faqSchema = `
      <Helmet>
        <script type="application/ld+json">
          {\`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [{
                "@type": "Question",
                "name": "Is this service free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, Aura Downloader is 100% free to use with no hidden fees or subscriptions."
                }
              }, {
                "@type": "Question",
                "name": "Are there any download limits?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, you can download as many videos and images as you want."
                }
              }, {
                "@type": "Question",
                "name": "Why is my download not working?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Some videos might be private, restricted, or deleted. Make sure the URL is correct and the post is publicly accessible."
                }
              }, {
                "@type": "Question",
                "name": "Do you store my downloaded files?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "No, we do not store any files on our servers. All processing is done on-the-fly and files are delivered directly to your device."
                }
              }]
            }
          \`}
        </script>
      </Helmet>
`;

pages = pages.replace(
    /export function FAQ\(\) \{\n  const theme = useThemeState\(\);\n  return \(\n    <StaticPageView title="Frequently Asked Questions" \{\.\.\.theme\}>/,
    `export function FAQ() {\n  const theme = useThemeState();\n  return (\n    <StaticPageView title="Frequently Asked Questions" {...theme}>\n${faqSchema}`
);

fs.writeFileSync('src/pages/StaticPages.tsx', pages);
console.log('FAQ schema added');
