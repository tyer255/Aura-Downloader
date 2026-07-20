const url = "https://www.youtube.com/shorts/dQw4w9WgXcQ";
const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
console.log(match ? match[1] : null);
