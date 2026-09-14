// Real keyboard/mouse inputs and screenshots; no injected game or camera state.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output=process.env.BROWSER_OUTPUT || '/tmp/bug-ticket-solid';await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.GAME_URL || 'http://192.168.185.41:4173/',{waitUntil:'networkidle'});
  const room=page.locator('#room');await page.locator('#room[data-visual="solid-3d"]').waitFor();
  await room.screenshot({path:`${output}/overview.png`});
  for(const id of ['support-desk','event-ledger','availability-rack','storefront-terminal','to-policy-archive'])assert.ok(await page.locator(`[data-world-target="${id}"]`).isVisible(),id);
  const rack=page.locator('[data-world-target="availability-rack"]');
  const initial=await rack.boundingBox();
  const canvas=room.locator('canvas');await canvas.focus();
  await page.keyboard.down('KeyD');
  try {
    await page.waitForFunction(x => document.querySelector('[data-world-target="availability-rack"]').getBoundingClientRect().x < x - 25, initial.x, {timeout:20000});
  } finally { await page.keyboard.up('KeyD'); }
  const walked=await rack.boundingBox();assert.ok(walked.x<initial.x-25,'WASD strafes camera');
  await room.screenshot({path:`${output}/walk-right.png`});
  await page.locator('[data-overview]').click();
  await canvas.focus();await page.keyboard.down('KeyW');await page.waitForTimeout(900);await page.keyboard.up('KeyW');
  await room.screenshot({path:`${output}/walk-forward.png`});
  const bounds=await canvas.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
  await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+140,bounds.y+bounds.height/2+20,{steps:12});await page.mouse.up();
  await room.screenshot({path:`${output}/look-left.png`});
  await page.locator('[data-overview]').click();
  await page.locator('[data-world-target="support-desk"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('bug-ticket-ontology-game/v0.6'))?.inspected.includes('support-desk'),null,{timeout:45000});
  await page.locator(".folder-inspection").waitFor();
  await page.locator("#return-to-room").click();
  await room.screenshot({path:`${output}/desk-close.png`});
  await page.locator('[data-overview]').click();
  await page.locator('[data-world-target="to-policy-archive"]').click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('bug-ticket-ontology-game/v0.6'))?.current_room==='policy-archive',null,{timeout:45000});
  await page.locator('[data-room-exit="incident-control-room"]').click();
  await page.locator('#room[data-visual="solid-3d"]').waitFor();
  await page.setViewportSize({width:390,height:844});
  await room.screenshot({path:`${output}/portrait.png`});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log('PASS solid overview, free strafe/forward/look, desk approach, physical door, room re-entry, portrait, no page errors');
} finally {await browser.close();}
