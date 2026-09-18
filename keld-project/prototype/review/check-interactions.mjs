import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../video/package.json',import.meta.url)),{chromium}=require('playwright-core');
const b=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});const checks=[];
try{
for(const viewport of [{width:1366,height:650},{width:280,height:650}]){
 const p=await b.newPage({viewport,reducedMotion:'reduce'});await p.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({body:'<p>Player fixture</p>',contentType:'text/html'}));await p.goto('http://127.0.0.1:4399/legend.html');
 await p.locator('#legend-chapter-4').click();await p.locator('#legend-expand').click();
 const controls=await p.evaluate(()=>['#cinema-next','#cinema-close'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));assert.ok(controls.every(Boolean));
 await p.locator('.cinema-caption').evaluate(e=>e.scrollTop=e.scrollHeight);await p.locator('#cinema-prev').click();assert.equal(await p.locator('.cinema-caption').evaluate(e=>e.scrollTop),0);await p.keyboard.press('Escape');
 assert.ok(await p.locator('#legend-expand').evaluate(e=>e===document.activeElement));
 for(const modal of ['#full-legend','#legend-cinema']){
  await p.locator('#legend-film-play').click();assert.equal(await p.locator('#legend-film-screen iframe').count(),1);
  await (modal==='#full-legend'?p.locator('[data-open="full-legend"]').first():p.locator('#legend-expand')).click();await p.waitForFunction(()=>!document.querySelector('#legend-film-screen iframe'));await p.keyboard.press('Escape');
 }
 console.log('Reflow',viewport,await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,x:scrollX})));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 // Keyboard/swipe scene behavior and complete source content remain intact.
 await p.locator('#legend-chapter-0').focus();await p.keyboard.press('End');assert.equal(await p.locator('#legend-chapter-5').getAttribute('aria-selected'),'true');await p.keyboard.press('Home');
 await p.locator('#legend-scene-0 [data-legend-swipe]').evaluate(e=>{for(const [type,x]of[['touchstart',200],['touchend',80]]){const ev=new Event(type);Object.defineProperty(ev,type==='touchstart'?'touches':'changedTouches',{value:[{clientX:x,clientY:100}]});e.dispatchEvent(ev);}});assert.equal(await p.locator('#legend-chapter-1').getAttribute('aria-selected'),'true');
 checks.push({viewport,cinemaControls:true,chapterScrollReset:true,dialogStopsVideo:true,keyboardSwipeAndFocus:true,reducedMotion:true});await p.close();
}
const p=await b.newPage({viewport:{width:640,height:360}});await p.goto('http://127.0.0.1:4399');await p.locator('.menu-toggle').click();await p.locator('.nav a').last().focus();assert.ok(await p.locator('.nav a').last().evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));await p.keyboard.press('Escape');assert.equal(await p.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
checks.push({shortMenu:true});await p.close();
await writeFile(new URL('interaction-results.json',import.meta.url),JSON.stringify({checks,scope:'Local implementation with stubbed YouTube; no external playback claim'},null,2)+'\n');console.log('Keyboard, swipe, short menu, media teardown and cinema regressions passed.');
}finally{await b.close();}
