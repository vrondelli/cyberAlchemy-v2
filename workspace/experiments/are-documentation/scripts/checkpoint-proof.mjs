import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const checks=[];
const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
try{
 const page=await browser.newPage({viewport:{width:1440,height:960}});
 await page.goto(process.env.ARE_CANVAS_URL??'http://127.0.0.1:4193/#view=intro');
 await page.getByRole('button',{name:'Pause ambient motion'}).click();
 const wait=async p=>{await page.waitForFunction(p=>Math.abs(Number(document.querySelector('.scroll-hero').dataset.progress)-p)<.001,p);await page.waitForTimeout(450)};
 const scroll=async p=>{await page.evaluate(p=>{const e=document.querySelector('.scroll-hero');scrollTo({top:scrollY+e.getBoundingClientRect().top-(parseFloat(getComputedStyle(document.querySelector('.hero-sticky')).top)||0)+(e.offsetHeight-document.querySelector('.hero-sticky').offsetHeight)*p,behavior:'instant'})},p);await wait(p)};
 const snapshot=()=>page.evaluate(()=>({stage:document.querySelector('.scroll-hero').dataset.stage,points:[...document.querySelectorAll('.particle')].map(e=>[e.getAttribute('cx'),e.getAttribute('cy')]),context:getComputedStyle(document.querySelector('.context-window')).transform,opacity:['.generated-engine','.projected-brain','.context-layer','.feedback-layer','.map-layer'].map(s=>Number(getComputedStyle(document.querySelector(s)).opacity))}));
 for(const [i,p] of [0.20,0.46,0.765,1].entries()){
  await scroll(p);const manual=await snapshot();
  await scroll(0);await page.getByRole('button',{name:new RegExp(`Chapter ${i+1}:`)}).click();await wait(p);const button=await snapshot();
  check(`chapter ${i+1}: scroll and button show the same scene`,JSON.stringify(manual)===JSON.stringify(button));
  check(`chapter ${i+1}: correct chapter`,button.stage===String(i));
  check(`chapter ${i+1}: scene fully visible`,button.opacity[i===0?0:i+1]>.99);
 }
 await page.keyboard.press('ArrowLeft');await wait(.765);check('keyboard uses the feedback checkpoint',(await snapshot()).stage==='2');
 await page.getByRole('button',{name:'Previous chapter',exact:true}).click();await wait(.46);check('previous arrow uses the context checkpoint',(await snapshot()).stage==='1');
 writeFileSync('evidence/checkpoint-proof.json',JSON.stringify({status:'PASS',checks,date:new Date().toISOString()},null,2));
 console.log(JSON.stringify({status:'PASS',checks:checks.length}));
}finally{await browser.close()}
