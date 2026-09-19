import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require('/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');
const browser=await chromium.launch({headless:true,executablePath:'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
const checks=[];const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name)};
try{
for(const [width,height] of [[1440,900],[331,587],[240,320]]){
 const p=await browser.newPage({viewport:{width,height}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:4193/?explanation=walkthrough');
 const section=p.locator('.walkthrough'),artifact=p.locator('.walk-artifact'),primary=p.locator('.walk-primary');
 await section.scrollIntoViewIfNeeded();
 check(width+': starts at first step',await p.locator('.walk-steps button').nth(0).getAttribute('aria-current')==='step');
 check(width+': capability explorer secondary',await p.locator('.walk-explorer').evaluate(e=>!e.open));
 for(let i=0;i<4;i++){
  check(width+': step '+i+' begins before',await artifact.getAttribute('data-result')==='false');
  await primary.click();
  check(width+': step '+i+' reveals result',await artifact.getAttribute('data-result')==='true');
  check(width+': step '+i+' names contribution',(await p.locator('.walk-takeaway').innerText()).length>30);
  await p.getByRole('button',{name:'Compare with before',exact:true}).click();
  check(width+': comparison preserves result access',await artifact.getAttribute('data-result')==='false');
  await p.getByRole('button',{name:'Show after',exact:true}).click();
  check(width+': comparison restores after',await artifact.getAttribute('data-result')==='true');
  if(i===0){
   const text=await artifact.innerText();
   check(width+': context preserves existing checks',text.includes('Form design + email checks')&&text.includes('Invitation rule + expiry checks'));
   check(width+': pricing explicitly outside',text.includes('Pricing discussion: saved outside'));
  }
  check(width+': step fits',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await primary.click();
 }
 check(width+': restart clears story',await artifact.getAttribute('data-lens')==='context'&&await artifact.getAttribute('data-result')==='false');
 const ids=['language','context','state','feedback','next','boundaries'],content={};
 for(let i=0;i<ids.length;i++){
  await p.locator('.walk-explorer>summary').click();
  await p.locator('.walk-capabilities button').nth(i).click();
  check(width+': capability '+ids[i]+' opens correct lens',await artifact.getAttribute('data-lens')===ids[i]);
  check(width+': capability jump focuses content',await p.locator('.walk-stage').evaluate(e=>e===document.activeElement));
  await primary.click();content[ids[i]]=await artifact.innerText();
  check(width+': scope remains visible',(await p.locator('.walk-scope').innerText()).length>30);
 }
 check(width+': feedback and decision differ',content.feedback!==content.next&&content.next.includes('Suggested next step'));
 check(width+': state and boundary differ',content.state!==content.boundaries&&content.boundaries.includes('Host responsibility'));
 await p.locator('.walk-steps button').nth(0).click();
 check(width+': revisiting retains revealed result',await artifact.getAttribute('data-result')==='true');
 await p.locator('.walk-steps button').nth(1).click();
 await p.locator('.walk-steps button').nth(0).click();
 check(width+': direct steps remain usable',await artifact.getAttribute('data-lens')==='context');
 await p.locator('.walk-stage').scrollIntoViewIfNeeded();await p.screenshot({path:'evidence/walkthrough-'+width+'.png'});
 check(width+': no browser errors',errors.length===0);
 await p.close();
}
const p=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
await p.goto('http://127.0.0.1:4193/?explanation=walkthrough');await p.locator('.walk-primary').focus();await p.keyboard.press('Enter');
check('keyboard reveal under reduced motion',await p.locator('.walk-artifact').getAttribute('data-result')==='true');
await p.locator('.walk-explorer>summary').focus();await p.keyboard.press('Enter');check('keyboard opens capabilities',await p.locator('.walk-explorer').evaluate(e=>e.open));
await p.locator('.walk-capabilities button').nth(5).focus();await p.keyboard.press('Enter');check('keyboard capability jump',await p.locator('.walk-artifact').getAttribute('data-lens')==='boundaries');
check('required naming introduction retained',await p.getByRole('heading',{name:'Why is it called Agent Reasoning Engine?'}).count()===1);
check('docs entry retained',await p.getByRole('button',{name:'Explore how it works ↗',exact:true}).count()===1);
writeFileSync('evidence/walkthrough-proof.json',JSON.stringify({status:'PASS',checks},null,2));console.log({status:'PASS',checks:checks.length});
}finally{await browser.close()}
