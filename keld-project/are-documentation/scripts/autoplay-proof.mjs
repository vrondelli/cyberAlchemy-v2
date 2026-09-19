import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const checks=[];function check(name,ok){if(!ok)throw Error(name);checks.push(name)}
try{
const p=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('http://127.0.0.1:4193/');
const hero=p.locator('.scroll-hero');await hero.waitFor();
await p.waitForFunction(()=>Number(document.querySelector('.scroll-hero').dataset.progress)>=.2);
const progress=()=>hero.getAttribute('data-progress');
check('first scene complete without scrolling',await p.evaluate(()=>scrollY===0));
await p.waitForTimeout(1200);check('scene holds',await progress()==='0.2000');
await p.getByRole('button',{name:'Pause animation',exact:true}).click();
const stopped=await progress();await p.waitForTimeout(4200);check('pause freezes sequence',stopped===await progress());
await p.getByRole('button',{name:'Resume animation',exact:true}).click();
await p.waitForFunction(()=>Number(document.querySelector('.scroll-hero').dataset.progress)>.2);
check('resume advances',true);
await p.getByRole('button',{name:/Chapter 3:/}).click();
check('manual selection seeks exact scene',await progress()==='0.7650');
await p.waitForTimeout(700);check('manual selection gets dwell',await progress()==='0.7650');
await p.locator('.landing-close').scrollIntoViewIfNeeded();await p.waitForTimeout(300);
const off=await progress();await p.waitForTimeout(600);check('offscreen stops',off===await progress());
await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
await p.waitForFunction(()=>document.querySelector('.scroll-hero').dataset.progress==='1.0000');
check('sequence finishes on overview',true);
await p.waitForTimeout(500);check('final scene remains',await progress()==='1.0000');
await p.getByRole('button',{name:'Replay ↺',exact:true}).click();check('replay restarts',Number(await progress())<.01);
await p.setViewportSize({width:280,height:500});await p.waitForTimeout(200);check('narrow page fits',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(250);const reduced=await progress();await p.waitForTimeout(500);check('reduced motion stops',reduced===await progress());
check('no errors',errors.length===0);console.log({status:'PASS',checks});
}finally{await browser.close()}
