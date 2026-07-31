import ytdl from 'youtube-dl-exec';

let options = {
  dumpSingleJson: true,
  noWarnings: true,
  noCheckCertificate: true,
  noPlaylist: true,
  noCheckFormats: true,
  extractorArgs: "youtube:player_client=android"
};

const data = await ytdl("https://www.youtube.com/watch?v=dQw4w9WgXcQ", options);
console.log("Formats total:", data.formats.length);
data.formats.forEach(f => {
    console.log(`id: ${f.format_id}, note: ${f.format_note}, ext: ${f.ext}, resolution: ${f.resolution}, vcodec: ${f.vcodec}, acodec: ${f.acodec}, height: ${f.height}`);
});
