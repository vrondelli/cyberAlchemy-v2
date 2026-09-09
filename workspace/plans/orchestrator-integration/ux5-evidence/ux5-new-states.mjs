import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
const scans=[];
try{
const page=await browser.newPage({viewport:{width:320,height:800},bypassCSP:true});
const run=JSON.parse(readFileSync('../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/operator-state.json')).runs[0];
for(const kind of ['ontology-list','strategy-list']){
 await page.goto(kind==='ontology-list'?'http://127.0.0.1:4187/#/apps/orchestrator/ontologies':'http://127.0.0.1:4191/runs/'+encodeURIComponent(run.run_key)+'?fixture=strategy');
 if(kind==='ontology-list'){await page.getByText('Browse records and relationships without the canvas',{exact:true}).click();}
 else await page.getByRole('list',{name:'Accepted run strategy dependencies',exact:true}).getByRole('button').last().click();
 await page.waitForTimeout(700);
 await page.addScriptTag({content:readFileSync('/tmp/orchestrator-ux/node_modules/axe-core/axe.min.js','utf8')});
 scans.push({kind,...await page.evaluate(async()=>{
 const root=document.querySelector('[data-workspace-frontend]')?.shadowRoot??document;
 const target=root.querySelector('.ontology-record-list')??root.querySelector('.run-strategy-visual');
 const result=await axe.run(target,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});
 return {violations:result.violations,incomplete:result.incomplete.map(r=>({id:r.id,count:r.nodes.length}))};
 })});
}
writeFileSync('/tmp/ux5-new-states.json',JSON.stringify(scans,null,2));
console.log(scans.map(r=>({kind:r.kind,violations:r.violations.map(v=>v.id),incomplete:r.incomplete})));
}finally{await browser.close();}
