import * as cheerio from 'cheerio';
import fetch from 'node-fetch';

async function search() {
  const res = await fetch("https://in.pinterest.com/search/pins/?q=videos&rs=typed");
  const html = await res.text();
  console.log(html.substring(0, 1000));
}
search();
