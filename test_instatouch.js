import instatouch from 'instatouch';

async function testInstatouch() {
  const url = "https://www.instagram.com/p/C3x-Z2_S0gY/";
  console.log("Testing instatouch for:", url);
  try {
    const meta = await instatouch.getPostMeta(url, {});
    console.log("instatouch keys:", Object.keys(meta));
    console.log("instatouch post:", meta.graphql?.shortcode_media ? "Found shortcode_media" : "No shortcode_media");
    if (meta.graphql?.shortcode_media) {
      const media = meta.graphql.shortcode_media;
      console.log("typename:", media.__typename);
      const edges = media.edge_sidecar_to_children?.edges;
      console.log("sidecar edges count:", edges?.length);
    }
  } catch(e) {
    console.log("instatouch err:", e.message);
  }
}

testInstatouch();
