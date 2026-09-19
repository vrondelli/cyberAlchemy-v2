import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const page=await browser.newPage({viewport:{width:1440,height:960}});const checks=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
const check=(n,v)=>{if(!v)throw Error(n);checks.push(n)};
const style=(s,p)=>page.locator(s).first().evaluate((e,p)=>getComputedStyle(e)[p],p);
try{
 await page.goto('http://127.0.0.1:4193/#view=intro',{waitUntil:'networkidle'});
 const first=await style('.idle-rotor-outer','transform');await page.waitForTimeout(250);check('rotor moves without scrolling',first!==await style('.idle-rotor-outer','transform'));
 check('inner rotor counter-rotates',await style('.idle-rotor-inner','animationDirection')==='reverse');
 await page.getByRole('button',{name:'Pause ambient motion',exact:true}).click();const stopped=await style('.idle-rotor-outer','transform');await page.waitForTimeout(250);check('pause freezes rotor',stopped===await style('.idle-rotor-outer','transform'));
 check('pause also freezes hologram float',await style('.hologram-shell','animationPlayState')==='paused');
 await page.getByRole('button',{name:'Resume ambient motion',exact:true}).click();await page.waitForTimeout(150);check('resume restarts rotor',stopped!==await style('.idle-rotor-outer','transform'));
 await page.getByRole('button',{name:/Explore how it works/}).click();await page.waitForTimeout(400);
 check('only property-related connections animate',await page.locator('.react-flow__edge.animated').count()===4);
 const dash=await style('.react-flow__edge.animated path','strokeDashoffset');await page.waitForTimeout(250);check('signal travels along edge',dash!==await style('.react-flow__edge.animated path','strokeDashoffset'));
 check('signals labelled illustrative',await page.getByText('Illustrative signals',{exact:true}).isVisible());
 await page.getByRole('button',{name:'Pause signal motion',exact:true}).click();check('canvas pause removes animated edges',await page.locator('.react-flow__edge.animated').count()===0);
 check('canvas pause stops node pulse',await style('.component:not(.dim) .icon-border svg','animationName')==='none');
 await page.getByRole('button',{name:'Resume signal motion',exact:true}).click();check('canvas resume restores signals',await page.locator('.react-flow__edge.animated').count()===4);
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);check('live reduced-motion setting stops signals',await page.locator('.react-flow__edge.animated').count()===0);
 check('reduced-motion setting stops icon pulse',await style('.component:not(.dim) .icon-border svg','animationName')==='none');
 await page.getByRole('link',{name:'Introduction',exact:true}).click();await page.waitForTimeout(100);check('reduced-motion setting disables ambient rotor',await style('.idle-rotor-outer','animationName')==='none');
 check('no runtime errors',errors.length===0);mkdirSync('evidence',{recursive:true});writeFileSync('evidence/motion-proof.json',JSON.stringify({status:'PASS',date:new Date().toISOString(),checks,errors,scope:'Illustrative UI motion only; no live engine state'},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length}));
}finally{await browser.close()}
