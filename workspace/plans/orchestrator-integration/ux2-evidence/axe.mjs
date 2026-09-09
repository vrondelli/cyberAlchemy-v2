// Local audit setup from UX-AUDIT.md. Open questions: ../UX2-READABILITY.md#open-questions.
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {writeFileSync,readFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},bypassCSP:true});
const origin=process.env.AUDIT_ORIGIN||'http://127.0.0.1:4187';
const data=await (await fetch(origin+'/api/v1/workspace/runs')).json();
const run=data.projection.runs.find(r=>r.execution==='succeeded');
const routes={runs:'/runs',overview:'/runs/'+encodeURIComponent(run.viewId),new:'/runs/new',operations:'/operations',lab:'/lab',ontologies:'/ontologies'};
const results=[];
try{
for(const [name,path] of Object.entries(routes)){
 await page.goto(origin+'/#/apps/orchestrator'+path);
 await page.locator('.embedded-console').waitFor();
 await page.addScriptTag({content:readFileSync('/tmp/orchestrator-ux/node_modules/axe-core/axe.min.js','utf8')});
 const tabs=name==='overview'?['Overview','Result','Strategy','Trace','Workers','Evidence','Lifecycle']:[null];
 for(const tab of tabs){
  if(tab)await page.getByRole('tab',{name:tab==='Trace'?/^Trace/:tab,exact:tab!=='Trace'}).click();
  await page.waitForTimeout(700); // Let entry/fade animations finish before steady-state contrast measurement.
  const scan=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return {version:r.testEngine.version,violations:r.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary,html:n.html}))})),incomplete:r.incomplete.map(v=>({id:v.id,count:v.nodes.length})),passes:r.passes.length};});
  results.push({name,tab,...scan}); writeFileSync('/tmp/orchestrator-ux/axe-partial.json',JSON.stringify(results,null,2));
 }
}
await page.goto(origin+'/#/apps/orchestrator/runs/new');
await page.getByRole('button',{name:'Review task',exact:true}).waitFor();
await page.route('**/native-tasks/review',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'runtime_unavailable'})}));
await page.getByRole('button',{name:'Review task',exact:true}).focus();
await page.keyboard.press('Enter');
await page.getByRole('alert').waitFor();
const recovery={alert:await page.getByRole('alert').innerText(),instructionRetained:await page.getByLabel('Instruction',{exact:true}).inputValue(),focused:await page.evaluate(()=>{let e=document.activeElement;while(e?.shadowRoot?.activeElement)e=e.shadowRoot.activeElement;return e?.textContent?.slice(0,100);})};
writeFileSync('/tmp/orchestrator-ux/axe.json',JSON.stringify({results,recovery},null,2));
console.log(JSON.stringify({results:results.map(r=>({name:r.name,tab:r.tab,violations:r.violations.map(v=>({id:v.id,count:v.nodes.length})),incomplete:r.incomplete})),recovery}));
}finally{await browser.close();}
