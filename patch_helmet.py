import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace helmet config
target = """      <Helmet>
        <title>{activeTabData.title}</title>
        <meta name="description" content={activeTabData.description} />
        {activeTabData.keywords && <meta name="keywords" content={activeTabData.keywords} />}
        <meta property="og:title" content={activeTabData.title} />
        <meta property="og:description" content={activeTabData.description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>"""

replacement = """      <Helmet>
        <title>{activeTabData.title}</title>
        <meta name="description" content={activeTabData.description} />
        {activeTabData.keywords && <meta name="keywords" content={activeTabData.keywords} />}
        <meta property="og:title" content={activeTabData.title} />
        <meta property="og:description" content={activeTabData.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={window.location.origin + "/banner.jpg"} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={activeTabData.title} />
        <meta property="twitter:description" content={activeTabData.description} />
        <meta property="twitter:image" content={window.location.origin + "/banner.jpg"} />
      </Helmet>"""

if target in content:
    content = content.replace(target, replacement)
    with open("src/App.tsx", "w") as f:
        f.write(content)
    print("Helmet updated")
else:
    print("Could not find target helmet")

