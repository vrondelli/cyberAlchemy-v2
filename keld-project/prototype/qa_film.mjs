import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../video/package.json',import.meta.url));
const {chromium}=require('playwright-core');
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,args:['--no-sandbox']});
const checks=[];
try {
 for(const width of [320,390,768,1440]) {
  const page=await browser.newPage({viewport:{width,height:1000}}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  // Verify our integration independently of YouTube availability / player policies.
  await page.route('https://www.youtube-nocookie.com/**',r=>r.fulfill({contentType:'text/html',body:'<p>Embedded player test fixture</p>'}));
  await page.goto('http://127.0.0.1:4399/legend.html');
  assert.equal(requests.filter(x=>x.includes('youtube')).length,0);
  assert.equal(await page.locator('#legend-film-screen iframe').count(),0);
  for(let i=0;i<6;i++){
   await page.locator(`#legend-chapter-${i}`).click();
   assert.equal(await page.locator('.legend-scene:visible').count(),1);
   const html=await page.locator(`#legend-scene-${i} .legend-full-prose`).innerHTML();
   assert.equal(html,await page.locator('#full-legend .story-prose').nth(i).innerHTML());
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.locator('#legend-chapter-5').focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('#legend-chapter-0').getAttribute('aria-selected'),'true');
  await page.locator('#legend-expand').click();
  assert.equal(await page.locator('#cinema-description').innerHTML(),await page.locator('#legend-scene-0 .legend-full-prose').innerHTML());
  await page.keyboard.press('Escape');assert.ok(await page.locator('#legend-expand').evaluate(e=>e===document.activeElement));
  await page.locator('[data-open="full-legend"]').first().click();assert.ok(await page.locator('#full-legend').evaluate(e=>e.open));await page.keyboard.press('Escape');
  await page.locator('#legend-film-play').click();
  const frame=page.locator('#legend-film-screen iframe');
  assert.match(await frame.getAttribute('src'),/youtube-nocookie.com\/embed\/ZQU8JeN6nQQ/);
  assert.equal(await frame.getAttribute('referrerpolicy'),'strict-origin-when-cross-origin');
  if(await page.locator('.menu-toggle').isVisible()) await page.locator('.menu-toggle').click();
  await page.locator('.shop-link').first().click();await page.waitForFunction(()=>!document.querySelector('#legend-film-screen iframe'));
  assert.equal(errors.length,0);
  await page.goto('http://127.0.0.1:4399/legend.html');
  await page.locator('#legend-film-screen').scrollIntoViewIfNeeded();await page.screenshot({path:new URL(`previews/film-${width}.png`,import.meta.url).pathname});
  await page.locator('#legend-chapter-4').click();await page.locator('#legend-scene-4 .legend-full-prose').scrollIntoViewIfNeeded();
  await page.screenshot({path:new URL(`previews/full-story-${width}.png`,import.meta.url).pathname});
  checks.push({width,passed:true,fullStoryMatchesReader:true,keyboardAndDialogs:true,noEagerYouTube:true,clickLoadsEmbed:true,shopStopsFilm:true});await page.close();
 }
 // Offline edition has embedded artwork and sends playback to the public video.
 const offline=await browser.newPage();await offline.goto(new URL('keld-legend-standalone.html',import.meta.url).href);
 assert.match(await offline.locator('#legend-film-play img').getAttribute('src'),/^data:image\/webp/);
 await offline.evaluate(()=>{window.open=(url)=>{window.openedVideo=url;};});await offline.locator('#legend-film-play').click();
 assert.equal(await offline.evaluate(()=>window.openedVideo),'https://www.youtube.com/watch?v=ZQU8JeN6nQQ');await offline.close();
 await writeFile(new URL('QA-film.json',import.meta.url),JSON.stringify({checks,offlineLink:true,limits:['YouTube iframe mocked for deterministic integration checks; actual playback depends on YouTube and the viewer network.'],openQuestionsRef:'FILM-INTEGRATION.md#open-questions'},null,2)+'\n');
 console.log('Film and complete-story checks passed at four widths, plus offline edition.');
} finally {await browser.close();}
