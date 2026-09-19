import {createRequire} from 'node:module';import {resolve} from 'node:path';import {mkdirSync,writeFileSync} from 'node:fs';import {serveBuild} from './serve-build.mjs';
const root=resolve(import.meta.dirname,'..'),require=createRequire(resolve(root,'../video/package.json')),{chromium}=require('playwright-core');
const server=await serveBuild(resolve(root,'dist')),browser=await chromium.launch({executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
const variants={control:'',artwork:'.scroll-hero[data-stage="0"] .generated-part,.scroll-hero[data-stage="0"] .generated-engine,.scroll-hero[data-stage="0"] .projected-brain{will-change:transform,opacity}',surfaces:'.story-particles,.particle-depth-surface,.engine-orbits,.mechanism-field{will-change:transform}'};
const runs=[];
try{for(let repeat=0;repeat<2;repeat++)for(const name of repeat?Object.keys(variants).reverse():Object.keys(variants)){
 const page=await browser.newPage({viewport:{width:390,height:844}}),cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Performance.enable');await cdp.send('LayerTree.enable');let layers=null;cdp.on('LayerTree.layerTreeDidChange',e=>layers=e.layers?.filter(l=>l.drawsContent).length??null);
 await page.goto(server.url);if(variants[name])await page.addStyleTag({content:variants[name]});
 await page.getByRole('button',{name:'Chapter 4:'}).click();await page.getByRole('button',{name:'Replay ↺',exact:true}).click();
 for(const scene of ['assembly','transition']){
  if(scene==='transition'){await page.getByRole('button',{name:'Chapter 1:'}).click();const start=await page.locator('.scroll-hero').getAttribute('data-progress');await page.waitForFunction(p=>document.querySelector('.scroll-hero').dataset.progress!==p,start)}
  const before=(await cdp.send('Performance.getMetrics')).metrics;
  const frames=await page.evaluate(()=>new Promise(done=>{let previous=performance.now(),start=previous;const values=[];function frame(now){values.push(now-previous);previous=now;if(now-start>=3000)done(values);else requestAnimationFrame(frame)}requestAnimationFrame(frame)}));
  const after=(await cdp.send('Performance.getMetrics')).metrics,metrics=Object.fromEntries(after.filter(m=>['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'].includes(m.name)).map(m=>[m.name,m.value-before.find(b=>b.name===m.name).value]));
  const result={variant:name,repeat:repeat+1,scene,layers,p95Ms:frames.sort((a,b)=>a-b)[Math.ceil(frames.length*.95)-1],metrics};runs.push(result);console.log(JSON.stringify(result));
 }
 await page.close();
}}finally{mkdirSync(resolve(root,'evidence/performance'),{recursive:true});writeFileSync(resolve(root,'evidence/performance/compositing-diagnostic.json'),JSON.stringify({scope:'Browser-only interventions, mobile viewport, 4x CPU, two alternating-order repetitions; not acceptance',runs},null,2)+'\n');await browser.close();await server.close()}
