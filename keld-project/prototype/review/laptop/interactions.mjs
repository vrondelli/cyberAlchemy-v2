import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../../video/package.json',import.meta.url));
const {chromium}=require('playwright-core');
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});
await page.goto('http://127.0.0.1:4399/index.html');
await page.locator('#legend-chapter-4').click();
await page.waitForTimeout(100);
const chapterClick=await page.evaluate(()=>({scrollY,scene:document.querySelector('#legend-scene-4').getBoundingClientRect().toJSON(),track:document.querySelector('.legend-chapter-track').getBoundingClientRect().toJSON(),title:document.querySelector('#legend-scene-4 h3').getBoundingClientRect().toJSON(),prev:document.querySelector('#legend-prev').getBoundingClientRect().toJSON()}));
await page.screenshot({path:new URL('chapter-click-result.png',import.meta.url).pathname});
await page.locator('#legend-expand').click();
await page.locator('#legend-cinema').evaluate(e=>e.scrollTop=e.scrollHeight);
const cinemaBottom=await page.locator('#legend-cinema').evaluate(e=>({scrollTop:e.scrollTop,close:e.querySelector('#cinema-close').getBoundingClientRect().toJSON(),next:e.querySelector('#cinema-next').getBoundingClientRect().toJSON()}));
await page.screenshot({path:new URL('cinema-bottom.png',import.meta.url).pathname});
await page.keyboard.press('Escape');
const dialogs=[];
for(const id of ['engine','note-gear','note-maker','note-mark','full-legend']){
 await page.locator('[data-open="'+id+'"]').first().click();
 dialogs.push(await page.locator('#'+id).evaluate(e=>({id:e.id,height:e.clientHeight,scrollHeight:e.scrollHeight,close:e.querySelector('[data-close]').getBoundingClientRect().toJSON()})));
 await page.keyboard.press('Escape');
}
const controls=await page.evaluate(()=>[...document.querySelectorAll('button,a')].filter(e=>e.getClientRects().length&&e.closest('#studio-view,.header')).map(e=>({text:e.textContent.trim().slice(0,55),height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width,font:getComputedStyle(e).fontSize})).filter(e=>e.height<24));
await writeFile(new URL('interactions.json',import.meta.url),JSON.stringify({chapterClick,cinemaBottom,dialogs,controls},null,2));
await browser.close();
console.log(JSON.stringify({chapterClick,cinemaBottom,dialogs,controls},null,2));
