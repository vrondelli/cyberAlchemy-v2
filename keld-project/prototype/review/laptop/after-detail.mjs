import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../../video/package.json',import.meta.url));
const {chromium}=require('playwright-core');
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox']});
const out=[];
for(const [width,height] of [[1366,650],[1024,640]]){
const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4399/index.html');
await page.locator('#gear').evaluate(e=>e.scrollIntoView({behavior:'instant'}));
const gear=await page.evaluate(()=>Object.fromEntries(['#gear','#gear .section-top','.section-intro','.engine-card','.engine-copy','.engine-copy h3','.engine-copy .engine-secondary','.engine-actions','.engine-tags','.territory'].map(s=>{const e=document.querySelector(s);if(!e)return [s,null];const b=e.getBoundingClientRect();return [s,{height:b.height,top:b.top,bottom:b.bottom}]})));
await page.locator('#legend-chapter-4').click();await page.waitForTimeout(100);
const viewer=await page.evaluate(()=>Object.fromEntries(['.legend-viewer','.legend-chapter-track','.legend-screen','#legend-scene-4','.legend-frame-nav'].map(s=>{const b=document.querySelector(s).getBoundingClientRect();return [s,{height:b.height,top:b.top,bottom:b.bottom}]})));
await page.screenshot({path:new URL('after-chapter-click-'+width+'.png',import.meta.url).pathname});
out.push({width,height,gear,viewer});await page.close();}
await writeFile(new URL('after-details.json',import.meta.url),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));await browser.close();
