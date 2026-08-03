const item = {
  carousel_media: [
    { id: 1, image_versions2: { candidates: [{url: "url1"}] } },
    { id: 2, image_versions2: { candidates: [{url: "url2"}] } },
    { id: 3, image_versions2: { candidates: [{url: "url3"}] } },
  ]
};

const items = item.carousel_media.map((child) => {
  let url = "";
  let type = "image";
  let thumb = "";
  if (child.video_versions && child.video_versions.length > 0) {
     url = child.video_versions[0].url;
     type = "video";
  } else if (child.image_versions2 && child.image_versions2.candidates && child.image_versions2.candidates.length > 0) {
     url = child.image_versions2.candidates[0].url;
  }
  return { url };
});
console.log(items);
