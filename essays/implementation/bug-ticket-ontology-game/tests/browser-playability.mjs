// Browser regression: use visible controls only. Read autosave for assertions;
// never inject state, call a reducer, or activate the hidden station shortcuts.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
const {chromium} = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const content = JSON.parse(await readFile(new URL('../content/game-content.json', import.meta.url)));
const output = process.env.BROWSER_OUTPUT || '/tmp/bug-ticket-playability';
await mkdir(output, {recursive:true});
const browser = await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1280,height:900}});
page.setDefaultTimeout(20000);
const errors = [];
page.on('pageerror', e => {errors.push(e.message);console.error('PAGE ERROR',e.message);});
const key = 'bug-ticket-ontology-game/v0.6';
const state = () => page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
async function changed(before) {
  await page.waitForFunction(({key,before})=>JSON.stringify(JSON.parse(localStorage.getItem(key)))!==before,{key,before},{timeout:45000});
}
async function dismissResponse() {
  if (await page.locator('.inspection-result, .folder-inspection').isVisible()) {
    assert.ok((await page.locator('#puzzle').innerText()).trim().length > 40);
    await page.locator('#return-to-room').click();
  }
}
async function inspect(id) {
  await dismissResponse();
  await page.locator('[data-overview]').click();
  const before = JSON.stringify(await state());
  await page.locator(`[data-world-target="${id}"]`).click();
  await changed(before);
  console.log('INSPECT',id,(await state()).active_puzzle);
}
async function room(id) {
  await dismissResponse();
  await page.locator(`[data-room-exit="${id}"]`).click();
  await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem(key)).current_room===id,{key,id});
  console.log('ROOM',id);
}
async function sequence(id) {
  for(const [i,token] of content.puzzles[id].solution.entries()) {
    let j=(await state()).puzzle_drafts[id].indexOf(token);
    while(j>i) {await page.locator(`[data-move="${j}:-1"]`).click();j--;}
  }
  await page.locator('#submit-puzzle').click();
}
try {
  await page.goto(process.env.GAME_URL || 'http://127.0.0.1:4174/',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#room').getAttribute('data-renderer'),'three');
  const folder = await page.locator('[data-world-target="support-desk"]').boundingBox();
  await page.mouse.click(folder.x + folder.width / 2, folder.y + folder.height + 9);
  await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k))?.inspected.includes('support-desk'), key, {timeout:45000});
  await page.locator('.folder-inspection').waitFor();
  console.log('PASS direct folder click and visible documents');
  assert.ok((await state()).inventory.includes('bug-ticket'));
  await page.screenshot({path:`${output}/desk.png`});
  await page.locator("#return-to-room").click();
  await page.locator('[data-overview]').click();
  await page.locator('[data-world-target="storefront-terminal"]').click();
  await page.locator('#restart').focus();
  assert.equal(await page.locator('.destination-marker').getAttribute('class'), 'destination-marker');
  assert.equal((await state()).inventory.includes('storefront-witness'), false);
  console.log('PASS blur cancels movement');
  await inspect('storefront-terminal');
  assert.ok((await state()).inventory.includes('storefront-witness'));
  assert.match(await page.locator('.inspection-result').innerText(),/09:17/);
  await dismissResponse();
  // A physical door must also be clickable, without the navigation bar.
  await page.locator('[data-overview]').click();
  await page.locator('[data-world-target="to-policy-archive"]').click();
  await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).current_room==='policy-archive',key,{timeout:45000});
  await inspect('quality-index');
  await page.screenshot({path:`${output}/archive.png`});
  await room('transfer-annex');await inspect('warehouse-scanner');
  await room('policy-archive');await room('incident-control-room');
  await inspect('event-ledger');
  await page.locator('#replay-address').fill('BUG-4821');await page.locator('#submit-puzzle').click();
  assert.match(await page.locator('.puzzle-feedback').innerText(),/address|ticket|identifier|sealed/i);
  await page.locator('#replay-address').fill('LP-2041 / 09:17 / R4');
  await page.locator('#dialog-hint').click();
  assert.equal(await page.locator('#replay-address').inputValue(),'LP-2041 / 09:17 / R4');await page.locator('#submit-puzzle').click();
  for(const token of content.puzzles['ledger-replay'].solution)await page.locator(`[data-rain-token="${token}"]`).click();
  await page.locator('#submit-puzzle').click();
  assert.equal((await state()).puzzle_drafts['ledger-replay'].reboot_required,true);
  await page.locator('#reload-checkpoint').click();
  await page.waitForLoadState('networkidle');
  await inspect('event-ledger');
  for(const token of content.puzzles['ledger-replay'].solution)await page.locator(`[data-rain-token="${token}"]`).click();
  await page.locator('#submit-puzzle').click();
  assert.ok((await state()).solved.includes('ledger-replay'));
  await inspect('availability-rack');assert.ok(await page.locator('#submit-puzzle').isDisabled());await page.locator('[data-circuit="quality_state"]').click();await page.locator('#submit-puzzle').click();
  await room('policy-archive');await inspect('policy-catalog');
  for(const [id,value] of Object.entries(content.puzzles['archive-coordinate'].solution)) {
    while((await state()).puzzle_drafts['archive-coordinate'][id]!==value)await page.locator(`[data-dial="${id}:1"]`).click();
  }
  await page.locator('#submit-puzzle').click();await inspect('meaning-dial');await sequence('meaning-chain');
  await inspect('ontology-bench');
  assert.ok(await page.locator('#submit-puzzle').isDisabled());
  await page.locator('[data-slot-item="policy-fragment"]').click();
  await page.locator('[data-slot="source"]').click();
  await page.locator('[data-slot="source"]').click();
  assert.equal((await state()).puzzle_drafts['relation-frame'].source,undefined);
  for(const slot of content.puzzles['relation-frame'].slots) {
    await page.locator(`[data-slot-item="${slot.accepts}"]`).click();await page.locator(`[data-slot="${slot.id}"]`).click();
  }
  await page.locator('#submit-puzzle').click();
  assert.ok(await page.locator('.inspection-result').isVisible());
  await dismissResponse();
  await page.locator('[data-overview]').click();
  await page.locator('[data-item="candidate-relation"]').dragTo(page.locator('[data-world-target="owner-terminal"]'));
  await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).inventory.includes('owner-seal'),key,{timeout:45000});
  console.log('PASS drag artifact to distant owner terminal');
  assert.ok((await state()).inventory.includes('owner-seal'));
  await room('transfer-annex');await inspect('inspection-table');await inspect('transfer-locker');
  assert.ok(await page.locator('#submit-puzzle').isHidden());
  await page.locator('[data-puzzle-item="residue-marker"]').click();
  await inspect('deployment-door');await sequence('evidence-chain');
  const final = await state();
  assert.equal(final.ending_id,'honest-construction');
  assert.equal(final.residue_preserved,true);
  assert.equal(final.solved.filter(id=>content.puzzles[id]).length,7);
  assert.deepEqual(errors,[]);
  await page.screenshot({path:`${output}/completed.png`,fullPage:true});
  console.log('PASS: visible responses, seven puzzles, address retention, slot removal, real reload, honest ending');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#ending-restart').click();
  await room('policy-archive');await room('transfer-annex');await inspect('deployment-door');
  assert.ok(await page.locator('#submit-puzzle').isDisabled());
  assert.match(await page.locator('.record-checklist').innerText(),/Missing: BUG-4821 ticket/);
  assert.ok(await page.locator('#override').isHidden());
  await page.locator('.override-choice summary').click();
  assert.match(await page.locator('.override-choice').innerText(),/45 integrity/);
  await page.locator('#override').click();
  assert.equal((await state()).ending_id,'false-green');
  assert.equal((await state()).integrity,55);
  assert.deepEqual(errors,[]);
  console.log('PASS: missing-record checklist and deliberate False green ending; no JavaScript errors');
} catch(error) {
  console.error(error);
  const observedState = await state();
  console.error('STATE', observedState);
  await writeFile(`${output}/state.json`, JSON.stringify(observedState));
  console.error('HIT TEST', await page.evaluate(() => {
    const button = document.querySelector('[data-overview]');
    const room = document.querySelector('#room');
    const box = button.getBoundingClientRect();
    return {button:box.toJSON(), room:room.getBoundingClientRect().toJSON(), scroll:[scrollX,scrollY,room.scrollLeft,room.scrollTop], hit:document.elementsFromPoint(box.x+box.width/2,box.y+box.height/2).map(el=>el.tagName+'.'+el.className)};
  }));
  await page.screenshot({path:`${output}/failure.png`,fullPage:true});
  process.exitCode=1;
} finally {await browser.close();}
