import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL || 'http://192.168.185.41:4173/?build=folder-action',{waitUntil:'networkidle'});
 const label=page.locator('[data-world-target="support-desk"]');const b=await label.boundingBox();
 await page.mouse.click(b.x+b.width/2,b.y+b.height+9);
 await page.locator('.folder-inspection').waitFor();
 assert.match(await page.locator('.folder-inspection').innerText(),/BUG-4821/);
 assert.match(await page.locator('.folder-inspection').innerText(),/ORD-99114/);
 await page.screenshot({path:'/tmp/btg-folder-open.png'});
 await page.keyboard.press('Escape');await page.locator('.folder-inspection').waitFor({state:'hidden'});
 await page.locator('.spatial-prompt').click();await page.locator('.folder-inspection').waitFor();
 await page.locator('#return-to-room').click();
 await page.reload({waitUntil:'networkidle'});
 await label.click();await page.locator('.folder-inspection').waitFor();
 const inventory=await page.evaluate(()=>JSON.parse(localStorage.getItem('bug-ticket-ontology-game/v0.6')).inventory);
 assert.equal(inventory.filter(x=>x==='bug-ticket').length,1);assert.equal(inventory.filter(x=>x==='order-receipt').length,1);
 await page.setViewportSize({width:390,height:844});
 assert.ok(await page.locator('#return-to-room').isVisible());
 await page.locator('#return-to-room').click();
 await page.locator('[data-overview]').click();await page.locator('[data-world-target="storefront-terminal"]').click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('bug-ticket-ontology-game/v0.6')).inspected.includes('storefront-terminal'));
 assert.deepEqual(errors,[]);
 console.log('PASS direct folder mesh click, visible ticket/receipt, Escape, Inspect button reopen, saved-state reopen without duplicate rewards, portrait close, next station');
} finally {await browser.close();}
