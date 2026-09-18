import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../../video/package.json',import.meta.url));
const {chromium}=require('playwright-core');
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox']});
const results=[];
for (const [width,height] of [[1366,650],[1366,768],[1536,730],[1024,640]]) {
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 await page.goto('http://127.0.0.1:4399/index.html'); await page.waitForTimeout(150);
 const geometry=await page.evaluate(()=>{
  const r=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,height:b.height,width:b.width,scrollHeight:e.scrollHeight,font:getComputedStyle(e).fontSize};};
  return {header:r('.header'),sections:Object.fromEntries(['#top','#gear','#legend','#studio','#notes','#contact'].map(s=>[s,r(s)])),heroCTA:r('.hero-actions'),heroAssembly:r('#assembly-toggle'),film:r('.legend-film'),filmScreen:r('.legend-film-screen'),scene:r('.legend-scene:not([hidden])'),frame:r('.legend-scene:not([hidden]) .legend-frame'),copy:r('.legend-scene:not([hidden]) .legend-scene-copy'),track:r('.legend-chapter-track'),horizontalOverflow:document.documentElement.scrollWidth-innerWidth};
 });
 await page.screenshot({path:new URL('after-hero-'+width+'x'+height+'.png',import.meta.url).pathname});
 for(const id of ['gear','studio','notes','contact']) {await page.locator('#'+id).evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));await page.screenshot({path:new URL('after-'+id+'-'+width+'x'+height+'.png',import.meta.url).pathname});}
 await page.locator('.legend-film').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));await page.screenshot({path:new URL('after-film-'+width+'x'+height+'.png',import.meta.url).pathname});
 const scenes=[];
 for(let i=0;i<6;i++){await page.locator('#legend-chapter-'+i).evaluate(e=>e.click());scenes.push(await page.locator('#legend-scene-'+i).evaluate(e=>({height:e.getBoundingClientRect().height,copy:e.querySelector('.legend-scene-copy').getBoundingClientRect().height}))); }
 await page.locator('#legend-chapter-4').evaluate(e=>e.click());await page.locator('.legend-screen').evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));await page.screenshot({path:new URL('after-scene-'+width+'x'+height+'.png',import.meta.url).pathname});
 await page.locator('#legend-expand').click();
 const cinema=await page.locator('#legend-cinema').evaluate(e=>({clientHeight:e.clientHeight,scrollHeight:e.scrollHeight,close:e.querySelector('#cinema-close').getBoundingClientRect().toJSON(),controls:e.querySelector('.cinema-controls').getBoundingClientRect().toJSON(),copy:e.querySelector('.cinema-copy').getBoundingClientRect().toJSON()}));
 await page.screenshot({path:new URL('after-cinema-'+width+'x'+height+'.png',import.meta.url).pathname});
 await page.keyboard.press('Escape');
 results.push({width,height,geometry,scenes,cinema}); await page.close();
}
await writeFile(new URL('after-geometry.json',import.meta.url),JSON.stringify(results,null,2));
await browser.close();
console.log(JSON.stringify(results.map(x=>({size:x.width+'x'+x.height,sections:Object.fromEntries(Object.entries(x.geometry.sections).map(([k,v])=>[k,Math.round(v.height)])),ctaBottom:Math.round(x.geometry.heroCTA.bottom),film:Math.round(x.geometry.film.height),sceneHeights:x.scenes.map(x=>Math.round(x.height)),cinema:x.cinema.scrollHeight})),null,2));
