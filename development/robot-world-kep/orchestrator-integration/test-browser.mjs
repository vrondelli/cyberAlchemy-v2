// Local replay smoke test. Runtime dependency and questions: README.md, PLAN.md.
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs');
if(!process.argv[2])throw Error('Usage: node test-browser.mjs REPLAY.html [SCREENSHOT.png]');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE || '/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
try {
 const page=await browser.newPage({viewport:{width:1000,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(resolve(process.argv[2])).href);
 const max=await page.locator('#tick').getAttribute('max');
 await page.locator('#tick').fill(max);await page.locator('#tick').dispatchEvent('input');
 assert.equal(await page.locator('#selected').textContent(),max);
 assert.match(await page.locator('#summary').textContent(),/Verification: PASS/);
 assert.equal(await page.locator('#actors tr').count(),2);
 if(process.argv[3])await page.screenshot({path:resolve(process.argv[3])});
 await page.setViewportSize({width:390,height:844});await page.locator('#tick').focus();
 await page.keyboard.press('Home');assert.equal(await page.locator('#selected').textContent(),'0');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',desktop:true,mobile:true,keyboard:true,actors:2,ticks:[0,Number(max)],page_errors:errors}));
}finally{await browser.close();}
