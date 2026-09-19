import {serveBuild} from './serve-build.mjs';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {engineNodes,engineEdges,workflowNodes} from '../src/engineGraph.ts';
import {engineTours} from '../src/engineTours.ts';
const require=createRequire(import.meta.url),pw=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const out=resolve('evidence/product-explorer');mkdirSync(out,{recursive:true});const server=await serveBuild(resolve('dist'));let browser;const checks=[],errors=[];
const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);console.log('PASS '+name);};
try{
 browser=await pw.chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.url+'?benchmark=1#view=continuity',{waitUntil:'networkidle'});await page.locator('.react-flow__node-engine').first().waitFor();await page.waitForTimeout(300);
 check('fresh entry selects the first feature',await page.getByRole('combobox',{name:'Focus a feature',exact:true}).inputValue()==='concepts');
 check('every semantic node retains an icon',await page.locator('.engine-node .sculpture-icon').count()===engineNodes.length);
 await page.screenshot({path:resolve(out,'first-route-desktop.png')});
 await page.getByRole('button',{name:'Show all',exact:true}).click();
 await page.waitForFunction(()=>{const r=document.querySelector('.react-flow')?.getBoundingClientRect();return r&&[...document.querySelectorAll('.react-flow__node-engine')].every(e=>{const n=e.getBoundingClientRect();return n.left>=r.left-1&&n.right<=r.right+1&&n.top>=r.top-1&&n.bottom<=r.bottom+1;});});
 check('Show all fits every semantic node',true);
 await page.screenshot({path:resolve(out,'whole-graph-desktop.png')});
 check('whole graph renders',await page.locator('.react-flow__node-engine').count()===engineNodes.length);
 check('no permanent edge labels',await page.locator('.react-flow__edge-text,.routed-label').count()===0);
 await page.evaluate(()=>window.originalGraph=document.querySelector('.react-flow'));
 for(const id of Object.keys(workflowNodes)){await page.getByRole('combobox',{name:'Focus a feature',exact:true}).selectOption(id);await page.waitForTimeout(100);check(`${id}: same complete graph`,await page.locator('.react-flow__node-engine').count()===engineNodes.length&&await page.evaluate(()=>window.originalGraph===document.querySelector('.react-flow')));}
 await page.getByRole('button',{name:'Start guided tour',exact:true}).click();await page.locator('[data-explanation="request"]').waitFor();
 check('tour attaches a single explanation without manuals or modal',await page.locator('.node-explanation').count()===1&&await page.locator('.documentation-card,[role=dialog]').count()===0);
 await page.screenshot({path:resolve(out,'tour-desktop.png')});
 for(const t of engineTours){await page.getByRole('combobox',{name:'Guided tour',exact:true}).selectOption(t.id);await page.getByRole('button',{name:'Start guided tour',exact:true}).click();for(let i=0;i<t.steps.length;i++){await page.locator(`[data-explanation="${t.steps[i].node}"]`).waitFor();if(i<t.steps.length-1)await page.locator('.node-explanation').getByRole('button',{name:'Next',exact:true}).click();}check(`${t.id}: every tour step completes`,true);}
 await page.getByRole('combobox',{name:'Guided tour',exact:true}).selectOption('request');await page.getByRole('button',{name:'Start guided tour',exact:true}).click();await page.locator('[data-explanation="request"]').waitFor();await page.locator('.node-explanation').getByRole('button',{name:'Next',exact:true}).click();await page.locator('[data-explanation="route"]').waitFor();
 const before=await page.locator('.react-flow__viewport').getAttribute('style');
 await page.getByRole('button',{name:'Read full guide →',exact:true}).click();await page.locator('.manual-page').waitFor();await page.getByRole('button',{name:'Return to canvas',exact:true}).first().click();await page.locator('[data-explanation="route"]').waitFor();await page.waitForTimeout(250);
 check('manual return restores viewport and selected node',before===await page.locator('.react-flow__viewport').getAttribute('style'));
 await page.reload({waitUntil:'networkidle'});await page.locator('[data-explanation="route"]').waitFor();check('reload pauses tour',await page.locator('.tour-position').textContent().then(t=>t.includes('paused')));
 await page.locator('.node-explanation').focus();await page.keyboard.press('Escape');check('Escape closes explanation',await page.locator('.node-explanation').count()===0);check('Escape restores node focus',await page.locator('[data-engine-node="route"]').evaluate(e=>e===document.activeElement));
 check('no browser errors',errors.length===0);
}catch(e){errors.push(String(e));console.error(e);process.exitCode=1;}finally{writeFileSync(resolve(out,'results.json'),JSON.stringify({status:errors.length?'FAIL':'PASS',checks,errors},null,2)+'\n');await browser?.close();await server.close();}
