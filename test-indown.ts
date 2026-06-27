import * as cheerio from 'cheerio';
async function test() {
    try {
        const url = 'https://www.instagram.com/reel/DEZc6oSSg7E/';
        
        // 1. Get token
        const res1 = await fetch('https://indown.io/', { headers: {'User-Agent': 'Mozilla/5.0'} });
        const html1 = await res1.text();
        const $1 = cheerio.load(html1);
        const token = $1('input[name="_token"]').val();
        
        // 2. Post
        const params = new URLSearchParams();
        params.append('referer', 'https://indown.io/en1');
        params.append('locale', 'en');
        params.append('_token', token as string);
        params.append('link', url);
        
        let cookies = [];
        res1.headers.forEach((v, k) => { if(k.toLowerCase()==='set-cookie') cookies.push(v.split(';')[0]) });
        const cookieStr = cookies.join('; ');
        
        const res2 = await fetch('https://indown.io/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0',
                'Cookie': cookieStr || '',
                'Origin': 'https://indown.io',
                'Referer': 'https://indown.io/'
            },
            body: params.toString()
        });
        const html2 = await res2.text();
        
        console.log(html2.substring(0, 1000));
        console.log("WAIT", html2.includes("dl=1") || html2.includes("video"));
        
        const $2 = cheerio.load(html2);
        console.log("body length:", html2.length);
        console.log("has error?", html2.includes("error"), html2.includes("Please wait"));
        console.log("body html snippet:", $2('body').text().replace(/\s+/g, ' ').substring(0, 1000));
        
    } catch(e) {
        console.error(e);
    }
}
test();
