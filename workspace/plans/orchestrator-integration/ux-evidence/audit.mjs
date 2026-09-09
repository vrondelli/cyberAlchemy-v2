// Local audit harness; Playwright and axe paths require the documented local setup.
// Open questions: ../UX-AUDIT.md#open-questions.
import {chromium} from '/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright/index.mjs';
import {writeFileSync} from 'node:fs';
const out=process.argv[2]||'/tmp/orchestrator-ux';
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const origin=process.env.AUDIT_ORIGIN||'http://127.0.0.1:4187';
const data=await (await fetch(origin+'/api/v1/workspace/runs')).json();
const run=data.projection.runs.find(r=>r.execution==='succeeded');
const routes={runs:'/runs',overview:'/runs/'+encodeURIComponent(run.viewId),new:'/runs/new',operations:'/operations',lab:'/lab',ontologies:'/ontologies'};
const records=[];
try{
for(const width of [1440,720,390,320]){
 await page.setViewportSize({width,height:1000});
 for(const [name,path] of Object.entries(routes)){
  await page.goto(origin+'/#/apps/orchestrator'+path);
  await page.locator('.embedded-console').waitFor();
  await page.waitForTimeout(300);
  const metrics=await page.locator('.embedded-console').evaluate(root=>{
   const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
   const entries=[...root.querySelectorAll('*')].filter(visible);
   const texts=entries.filter(e=>e.children.length===0&&e.textContent.trim()).map(e=>({text:e.textContent.trim().slice(0,90),tag:e.tagName,cls:e.className,font:getComputedStyle(e).fontSize,color:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor}));
   const controls=entries.filter(e=>e.matches('button,a,input,textarea,select,summary,[tabindex]')).map(e=>{const r=e.getBoundingClientRect();return {text:e.getAttribute('aria-label')||e.textContent.trim().slice(0,60),tag:e.tagName,w:r.width,h:r.height,tabIndex:e.tabIndex,disabled:e.disabled||false};});
   return {width:root.clientWidth,scrollWidth:root.scrollWidth,documentOverflow:document.documentElement.scrollWidth>innerWidth,tinyText:texts.filter(e=>parseFloat(e.font)<12),smallControls:controls.filter(e=>e.w<24||e.h<24),headings:entries.filter(e=>/^H[1-6]$/.test(e.tagName)).map(e=>e.textContent),graphHeight:root.querySelector('.run-strategy-visual')?.getBoundingClientRect().height||0};
  });
  records.push({width,name,...metrics});
  if(['overview','runs','new'].includes(name)&&[1440,320].includes(width))await page.screenshot({path:out+'/'+name+'-'+width+'.png',fullPage:true});
 }
}
await page.setViewportSize({width:1440,height:1000});
await page.goto(origin+'/#/apps/orchestrator'+routes.overview);
await page.getByRole('tab',{name:'Overview',exact:true}).waitFor();
await page.getByRole('tab',{name:'Overview',exact:true}).focus();
await page.keyboard.press('ArrowRight');
const tabKeyboard={selected:await page.getByRole('tab',{selected:true}).innerText(),focused:await page.getByRole('tab',{selected:true}).evaluate(e=>e.getRootNode().activeElement===e)};
await page.getByRole('navigation',{name:'Orchestrator sections'}).getByRole('link',{name:'Runs',exact:true}).click();
const routeFocus=await page.evaluate(()=>{let e=document.activeElement;while(e?.shadowRoot?.activeElement)e=e.shadowRoot.activeElement;return {tag:e?.tagName,text:e?.textContent?.slice(0,80)};});
writeFileSync(out+'/audit.json',JSON.stringify({browser:browser.version(),runCount:data.projection.runs.length,records,tabKeyboard,routeFocus},null,2));
console.log(JSON.stringify({browser:browser.version(),records:records.map(r=>({width:r.width,name:r.name,overflow:r.scrollWidth>r.width||r.documentOverflow,tiny:r.tinyText.length,small:r.smallControls.length,graphHeight:r.graphHeight,headings:r.headings.slice(0,3)})),tabKeyboard,routeFocus}));
}finally{await browser.close();}
