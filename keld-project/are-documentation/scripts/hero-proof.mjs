import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(root,'evidence');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const page=await browser.newPage({viewport:{width:1440,height:960}});
const errors=[],external=[],checks=[],states=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('request',r=>{if(!r.url().startsWith('data:')&&!['127.0.0.1','localhost'].includes(new URL(r.url()).hostname))external.push(r.url())});
const check=(name,value)=>{if(!value)throw Error(name);checks.push(name)};
async function seek(progress){await page.evaluate(p=>{const el=document.querySelector('.scroll-hero');scrollTo({top:scrollY+el.getBoundingClientRect().top-(parseFloat(getComputedStyle(document.querySelector('.hero-sticky')).top)||0)+(el.offsetHeight-document.querySelector('.hero-sticky').offsetHeight)*p,behavior:'instant'})},progress);await page.waitForTimeout(420)}
async function state(){return page.evaluate(()=>({stage:document.querySelector('.scroll-hero').dataset.stage,points:[...document.querySelectorAll('.particle')].map(e=>[+e.getAttribute('cx'),+e.getAttribute('cy')]),hologram:getComputedStyle(document.querySelector('.hero-hologram')).opacity,tracer:document.querySelector('.feedback-tracer').getAttribute('style'),draw:document.querySelector('.feedback-track').getAttribute('stroke-dashoffset')}))}
try{
 await page.goto(process.env.ARE_CANVAS_URL??'http://127.0.0.1:4193/#view=intro',{waitUntil:'networkidle'});
 check('four chapter checkpoints',await page.getByRole('button',{name:/Chapter [1-4]:/}).count()===4);
 check('explanation permanently present',await page.locator('.engine-explanation').count()===1);
 check('three independent generated engine sections',await page.locator('.generated-part').count()===3);
 check('96 persistent particles',await page.locator('.particle').count()===96);
 check('72 independently staggered ticks',await page.locator('.calibration-tick').count()===72);
 for(const [index,name,progress] of [[0,'assembly',0],[1,'context',.43],[2,'feedback',.70],[3,'map',1]]){
  await seek(progress);const snap=await state();states.push(snap);
  check(`${name}: correct chapter`,snap.stage===String(index));
  check(`${name}: explanation shortcut present`,await page.locator('.understand-trigger').count()===1);

  check(`${name}: only current chapter exposed`,await page.getByRole('heading',{level:1}).count()===1);
  check(`${name}: pinned stage fills viewport`,await page.locator('.hero-sticky').evaluate(e=>Math.abs(e.getBoundingClientRect().top-document.querySelector('.topbar').getBoundingClientRect().bottom)<2&&Math.abs(e.getBoundingClientRect().bottom-innerHeight)<2));
  await page.screenshot({path:resolve(out,`v2-${name}.png`)});
 }
 for(let j=1;j<states.length;j++){
  const mean=states[j].points.reduce((sum,p,i)=>sum+Math.hypot(p[0]-states[j-1].points[i][0],p[1]-states[j-1].points[i][1]),0)/96;
  check(`scene ${j}: substantial particle reorganization`,mean>65);
 }
 check('final map has eight visible icon stations',await page.locator('.map-station').evaluateAll(es=>es.length===8&&es.every(e=>+getComputedStyle(e).opacity>.95)));
 check('final map replaces raster',Number(states[3].hologram)<.01);
 await seek(.61);const a=await state();await seek(.69);const b=await state();check('tracer travels during feedback phase',a.tracer!==b.tracer);
 await seek(0);const reversed=await state();check('reverse scroll restores initial geometry',reversed.points.every((p,i)=>Math.hypot(p[0]-states[0].points[i][0],p[1]-states[0].points[i][1])<1));
 await page.getByRole('button',{name:/Chapter 3:/}).click();await page.waitForFunction(()=>document.querySelector('.scroll-hero').dataset.stage==='2');check('chapter controls navigate scroll',true);
 await page.setViewportSize({width:390,height:844});
 for(const [i,p]of [[0,0],[1,.43],[2,.70],[3,1]]){
  await seek(p);check(`mobile ${i}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`mobile ${i}: animation centered`,await page.locator('.story-visual').evaluate(e=>Math.abs(e.getBoundingClientRect().x+e.getBoundingClientRect().width/2-innerWidth/2)<2));
  await page.screenshot({path:resolve(out,`v2-mobile-${i}.png`)});
 }
 await page.setViewportSize({width:360,height:640});
 for(const [i,p] of [[0,0],[1,.43],[2,.70],[3,1]]){
  await seek(p);check(`short mobile ${i}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.screenshot({path:resolve(out,'v2-short-mobile.png')});
 const animationEnd=await page.locator('.scroll-hero').evaluate(e=>e.getBoundingClientRect().bottom+scrollY);
 check('article follows animation',await page.locator('.engine-explanation').evaluate((e,end)=>e.getBoundingClientRect().top+scrollY>=end-1,animationEnd));
 await page.locator('#engine-explanation-title').scrollIntoViewIfNeeded();
 check('normal page reading',await page.locator('.engine-explanation').evaluate(e=>getComputedStyle(e).overflowY==='visible'));
 check('startup story present',await page.locator('.engine-explanation').innerText().then(t=>t.includes('invitation-only')));
 await page.screenshot({path:resolve(out,'continuous-explanation-mobile.png')});
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'networkidle'});
 check('reduced motion exposes explanation immediately',await page.locator('.engine-explanation').isVisible());
 check('reduced motion removes pinned interaction',await page.locator('.hero-sticky').evaluate(e=>getComputedStyle(e).position==='relative'));
 check('reduced motion disables animated visualization',await page.locator('.story-visual').evaluate(e=>getComputedStyle(e).display==='none'));
 check('reduced motion no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:resolve(out,'v2-reduced-motion.png'),fullPage:true});
 await page.getByRole('button',{name:/Explore how it works/}).click();await page.waitForTimeout(200);check('hero opens working canvas',await page.locator('.icon-button').count()===8);
 await page.getByRole('link',{name:'Introduction',exact:true}).click();await page.waitForTimeout(250);check('hero remount has no duplicated particles',await page.locator('.particle').count()===96);
 check('no runtime errors',errors.length===0);check('no external requests',external.length===0);
 writeFileSync(resolve(out,'hero-proof.json'),JSON.stringify({status:'PASS',date:new Date().toISOString(),checks,errors,external,states,scope:'Actual rendered geometry, reversible motion, chapter semantics, mobile and reduced-motion checks. Not a comprehension or preference study.'},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length}));
}finally{await browser.close()}
