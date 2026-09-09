// Local audit harness; Playwright/axe setup is in UX-AUDIT.md.
// Open questions: ../UX3-FOCUS-RECOVERY.md#open-questions.
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},bypassCSP:true});
 await page.goto('http://127.0.0.1:4193/#/apps/orchestrator/runs/new');
 await page.getByRole('button',{name:'Review task',exact:true}).waitFor();
 await page.addScriptTag({content:readFileSync('/tmp/orchestrator-ux/node_modules/axe-core/axe.min.js','utf8')});
 const scans=[];
 const scan=async name=>{await page.waitForTimeout(700);const result=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}});return {violations:r.violations,incomplete:r.incomplete.map(v=>({id:v.id,count:v.nodes.length}))};});scans.push({name,...result});};
 await scan('editor ready');
 await page.getByLabel('Supplied input',{exact:true}).fill('');await page.getByRole('button',{name:'Review task',exact:true}).click();await scan('field validation');
 await page.getByLabel('Supplied input',{exact:true}).fill('Draft kept.');
 await page.route('**/native-tasks/review',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'RUNTIME_UNAVAILABLE'})}));
 await page.getByRole('button',{name:'Review task',exact:true}).click();await page.getByRole('alert').waitFor();await scan('review failure');
 await page.screenshot({path:'/tmp/ux3-recovery/review-error-mobile.png',fullPage:true});
 writeFileSync('/tmp/ux3-recovery/accessibility.json',JSON.stringify({browser:browser.version(),axe:'4.13.0',scans,open_questions_ref:'UX3-FOCUS-RECOVERY.md#open-questions'},null,2));console.log(scans.map(s=>({name:s.name,violations:s.violations.map(v=>v.id),incomplete:s.incomplete})));
}finally{await browser.close();}
