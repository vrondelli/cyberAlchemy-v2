import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);const {chromium}=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});const page=await browser.newPage({viewport:{width:1440,height:960}});const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(n,v)=>{if(!v)throw Error(n);checks.push(n)};
async function seek(p){await page.evaluate(p=>{const el=document.querySelector('.scroll-hero');scrollTo({top:scrollY+el.getBoundingClientRect().top-(parseFloat(getComputedStyle(document.querySelector('.hero-sticky')).top)||0)+(el.offsetHeight-document.querySelector('.hero-sticky').offsetHeight)*p,behavior:'instant'})},p);await page.waitForTimeout(250)}
const opacity=s=>page.locator(s).evaluate(e=>+getComputedStyle(e).opacity);
const positions=()=>page.locator('.generated-part').evaluateAll(es=>es.map(e=>getComputedStyle(e).transform));
try{
await page.goto('http://127.0.0.1:4193/#view=intro',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Pause ambient motion',exact:true}).click();await seek(0);
check('five generated asset layers loaded',await page.locator('.projected-engine img').evaluateAll(es=>es.length===5&&es.every(e=>e.complete&&e.naturalWidth>0)));
const alpha=await page.locator('.projected-engine img').evaluateAll(es=>es.map(e=>{const c=document.createElement('canvas');c.width=e.naturalWidth;c.height=e.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(e,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let transparent=0;for(let i=3;i<d.length;i+=4)if(d[i]===0)transparent++;return{asset:e.src.split('/').pop(),transparentFraction:transparent/(d.length/4)}}));
check('each image has genuine transparent background',alpha.every(a=>a.transparentFraction>.1));
check('three independently movable sections',await page.locator('.generated-part').count()===3);const start=await positions();check('parts begin separated',new Set(start).size===3);
check('brain initially hidden',await opacity('.projected-brain')===0);check('projector initially off',await opacity('.projector-emitter')===0);
mkdirSync('evidence',{recursive:true});await page.screenshot({path:'evidence/projection-exploded.png'});
await seek(.119);check('completed engine replaces exploded parts',await opacity('.generated-engine')>.99&&await opacity('.generated-assembly-parts')<.01);check('brain waits until after assembly',await opacity('.projected-brain')===0);await page.screenshot({path:'evidence/projection-engine.png'});
await seek(.143);check('beam starts before brain appears',await opacity('.projector-beam')>0&&await opacity('.projected-brain')===0);
await seek(.2);check('brain projected at end',await opacity('.projected-brain')>.89);check('projector and beam visible',await opacity('.projector-emitter')>.99&&await opacity('.projector-beam')>.99);check('brain positioned above engine',await page.evaluate(()=>document.querySelector('.projected-brain').getBoundingClientRect().bottom<document.querySelector('.generated-engine').getBoundingClientRect().top+40));await page.screenshot({path:'evidence/projection-brain.png'});
await seek(0);check('reverse scroll restores separated state',JSON.stringify(await positions())===JSON.stringify(start)&&await opacity('.projected-brain')===0);
await page.getByRole('button',{name:/Chapter 1:/}).click();await page.waitForFunction(()=>+getComputedStyle(document.querySelector('.projected-brain')).opacity>.89);check('assembly shortcut remains in opening chapter',await page.locator('.scroll-hero').getAttribute('data-stage')==='0');
await page.setViewportSize({width:390,height:844});await seek(.2);await page.screenshot({path:'evidence/projection-mobile.png'});check('mobile no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
check('no runtime errors',errors.length===0);writeFileSync('evidence/assembly-proof.json',JSON.stringify({status:'PASS',checks,alpha,errors,date:new Date().toISOString(),scope:'Generated hologram compositing and projection sequence; not engineering accuracy'},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length,alpha}));
}finally{await browser.close()}
