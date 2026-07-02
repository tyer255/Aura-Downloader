const igdown = require('igdown-scrapper');
igdown('https://www.instagram.com/p/C-Xy1xSOPkG/').then(console.log).catch(e => console.error(e.message));
