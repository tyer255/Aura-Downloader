import { GoogleGenAI } from "@google/genai";
import puppeteer from "puppeteer";
import fs from "fs";

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto("https://www.instagram.com/p/C-Xy1xSOPkG/embed/");
  const html = await page.content();
  await browser.close();
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Extract the video URL and thumbnail from this HTML. Format as JSON. HTML: ${html.substring(0, 50000)}`
  });
  console.log(response.text);
}
run();
