import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
const require=createRequire(import.meta.url);const {chromium}=require('/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const b=await chromium.launch({headless:true,executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});const checks=[];const check=(n,v)=>{if(!v)throw Error(n);checks.push(n)};mkdirSync('evidence',{recursive:true});mkdirSync('public/background-previews',{recursive:true});
try{const p=await b.newPage({viewport:{width:1280,height:800}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
for(const kind of ['halo','grid','light','signals','particles']){
 await p.setViewportSize({width:1280,height:800});await p.goto(`http://127.0.0.1:4193/?background=${kind}#view=intro`);await p.getByRole('button',{name:/Chapter 1:/}).click();await p.waitForTimeout(1100);
 check(`${kind}: background mounted`,await p.locator(`.backdrop-${kind}`).count()===1);
 await p.getByRole('button',{name:'Pause ambient motion',exact:true}).click();await p.mouse.move(5,790);await p.waitForTimeout(450);
 check(`${kind}: pause applies`,await p.locator('.hero-backdrop').evaluate(e=>[...e.querySelectorAll('*')].every(n=>getComputedStyle(n).animationPlayState==='paused')));
 await p.screenshot({path:`public/background-previews/${kind}.png`});
 await p.setViewportSize({width:280,height:500});await p.waitForTimeout(250);check(`${kind}: narrow pane fits`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);check(`${kind}: reduced motion stops background`,await p.locator('.hero-backdrop').evaluate(e=>[...e.querySelectorAll('*')].every(n=>getComputedStyle(n).animationName==='none')));await p.emulateMedia({reducedMotion:'no-preference'});
}
await p.goto('http://127.0.0.1:4193/#view=intro');check('particle surface is the selected default',await p.locator('.backdrop-particles').count()===1);
await p.setViewportSize({width:1600,height:1080});await p.goto('http://127.0.0.1:4193/background-options.html');await p.locator('img').last().waitFor();check('five loaded previews',await p.locator('img').evaluateAll(es=>es.length===5&&es.every(e=>e.complete&&e.naturalWidth>0)));await p.screenshot({path:'evidence/background-comparison.png',fullPage:true});check('no errors',errors.length===0);writeFileSync('evidence/background-options-proof.json',JSON.stringify({status:'PASS',checks},null,2));console.log(JSON.stringify({status:'PASS',checks:checks.length}));
}finally{await b.close()}
