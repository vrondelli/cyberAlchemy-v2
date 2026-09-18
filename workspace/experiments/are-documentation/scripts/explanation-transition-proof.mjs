import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const checks=[];const check=(name,value)=>{if(!value)throw Error(name);checks.push(name)};
try {
 const p=await browser.newPage();
 for(const [width,height] of [[1440,960],[331,587]]){
  await p.setViewportSize({width,height});await p.goto('http://127.0.0.1:4193/#view=intro');
  check(`${width}: article follows animation`,await p.locator('.engine-explanation').evaluate(e=>e.getBoundingClientRect().top>=document.querySelector('.scroll-hero').getBoundingClientRect().bottom-1));
  check(`${width}: explanation shortcut present`,await p.locator('.understand-trigger').count()===1);
  await p.getByRole('button',{name:/Chapter 4:/}).click();await p.waitForTimeout(1300);
  const y=await p.evaluate(()=>scrollY);await p.mouse.wheel(0,450);await p.waitForTimeout(450);
  check(`${width}: continuous page scroll`,await p.evaluate(y=>scrollY>y,y));
  check(`${width}: normal flow`,await p.locator('.engine-explanation').evaluate(e=>getComputedStyle(e).position==='relative'&&getComputedStyle(e).overflowY==='visible'));
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(300);
  await p.getByRole('button',{name:'Continue to explanation ↓'}).click();await p.waitForTimeout(1600);
  check(`${width}: shortcut reaches first section`,await p.locator('#engine-explanation-title').evaluate(e=>e===document.activeElement&&e.getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom&&e.getBoundingClientRect().top<innerHeight));
  check(`${width}: landing introduction, exploration and final invitation`,await p.locator('.engine-explanation > section').count()===3);
  await p.screenshot({path:`evidence/continuous-explanation-${width}.png`});
  check(`${width}: no horizontal overflow`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(300);
  check(`${width}: animation revisitable`,await p.locator('.scroll-hero').getAttribute('data-stage')==='0');
 }
 await p.getByRole('button',{name:'Go to docs ↗'}).click();
 check('direct docs opens canvas',await p.locator('.react-flow').count()===1);
 await p.getByRole('link',{name:'Introduction',exact:true}).click();
 await p.emulateMedia({reducedMotion:'reduce'});await p.reload();
 check('reduced motion direct explanation',await p.locator('#engine-explanation-title').evaluate(e=>e.getBoundingClientRect().top<innerHeight));
 writeFileSync('evidence/explanation-transition-proof.json',JSON.stringify({status:'PASS',checks},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length}));
}finally{await browser.close()}
