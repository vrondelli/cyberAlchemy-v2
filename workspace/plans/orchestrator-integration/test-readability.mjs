// Actual rendered semantic/typography regression checks.
// Open questions: UX2-READABILITY.md#open-questions.
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const origin=process.argv[2]??'http://127.0.0.1:4192';
const output=process.argv[3]??'/tmp/ux2-measure';
const b=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
try{
const p=await b.newPage({viewport:{width:1440,height:1000}});
await p.goto(origin+'/#/apps/orchestrator/runs');
const list=p.getByRole('list',{name:'Projected runs'});await list.waitFor();
assert.ok(await list.getByRole('link').count()>0);
assert.equal(await list.getByRole('link').count(),await list.getByRole('listitem').count());
assert.equal(await p.getByRole('img',{name:'CyberAlchemy Workspace',exact:true}).count(),1);
assert.equal(await list.getByRole('status').count(),0);
await p.getByRole('navigation',{name:'Orchestrator sections'}).getByRole('link',{name:'Lab',exact:true}).click();
const table=p.getByRole('table',{name:'Assignable persona pool'});await table.waitFor();
const button=table.getByRole('button').first();await button.focus();await button.press('Enter');assert.equal(await button.getAttribute('aria-expanded'),'true');await button.press('Escape');assert.equal(await button.getAttribute('aria-expanded'),'false');assert.equal(await table.getByRole('region').count(),0);await button.press('Space');assert.equal(await button.getAttribute('aria-expanded'),'true');
await p.screenshot({path:output+'/lab-desktop.png',fullPage:true});
await p.setViewportSize({width:320,height:800});
await p.screenshot({path:output+'/lab-mobile.png',fullPage:true});
const bounds=await table.evaluate(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth}));
console.log(bounds);
await p.goto(origin+'/#/apps/orchestrator/runs');
await list.waitFor();await list.getByRole('link').first().focus();await list.getByRole('link').first().press('Enter');
const tabs=p.getByRole('tab',{name:'Overview',exact:true});await tabs.waitFor();
const base=await tabs.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert.ok(base>=14);
await p.evaluate(()=>document.documentElement.style.fontSize='200%');
const enlarged=await tabs.evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert.equal(enlarged,base*2);
await p.screenshot({path:output+'/text-resize.png',fullPage:true});
writeFileSync(output+'/checks.json',JSON.stringify({status:'PASS',checks:['native links inside list items; status outside list','persona button Enter, Space and Escape','run tabs use 14px text and respond to root text resize'],labMobileBounds:bounds,tabFont:{base,enlarged},open_questions_ref:'UX2-READABILITY.md#open-questions'},null,2));
}finally{await b.close();}
