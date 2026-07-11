const http = require('http');

http.get('http://localhost:3000/api/proxy-download?url=https%3A%2F%2Fyt3.googleusercontent.com%2FnxYrc_1_2f77DoBadyxMTmv7ZpRZapHR5jbuYe7PlPd5cIRJxtNNEYyOC0ZsxaDyJJzXrnJiuDE%3Ds0&filename=avatar.jpg&inline=true', (res) => {
    console.log(res.statusCode);
    console.log(res.headers);
});
