import {createRequire,registerHooks} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const require=createRequire(new URL('../../../video/package.json',import.meta.url));
const core=require.resolve('playwright-core');
// Supply the already-installed browser driver; do not install or modify TasteCheck.
registerHooks({resolve(specifier,context,next){if(specifier==='playwright'&&context.parentURL?.includes('/tastecheck/'))return next(pathToFileURL(core.replace(/index.js$/, 'index.mjs')).href,context);return next(specifier,context);}});
const taste=new URL('../../../../../tastecheck/',import.meta.url);
const {collectPageEvidence}=await import(new URL('tools/taste-oracle/capture.mjs',taste));
const {findClippedProbes}=await import(new URL('tools/taste-oracle/lib/evidence.mjs',taste));
const {chromium}=require('playwright-core');
const mode=process.argv[2]??'before',out=new URL(mode+'/',import.meta.url);await mkdir(out,{recursive:true});
const gate=await readFile(new URL('skills/tastecheck-pass/assets/gate-audit.js',taste),'utf8');
const a11y=await readFile(new URL('skills/a11y-pass/assets/audit.js',taste),'utf8');
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});
const results=[];
try{
for(const [width,height] of [[1366,768],[1536,864],[1920,1080],[1280,720],[1024,640],[390,844],[320,640]]){
 const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:4399/index.html');
 const logs=[];page.on('console',m=>logs.push(m.text()));
 const gateResult=await page.evaluate(gate),a11yResult=await page.evaluate(a11y);
 const sections=await page.evaluate(()=>[...document.querySelectorAll('#studio-view>section')].map(e=>({id:e.id,height:Math.round(e.getBoundingClientRect().height)})));
 const captures=[];
 for(const scene of [-1,0,4]){
  const selector=scene<0?'.hero':'.legend-viewer';
  if(scene>=0)await page.locator(`#legend-chapter-${scene}`).click();
  await page.evaluate(({selector,scene})=>{
   document.querySelectorAll('[data-oracle-probe]').forEach(e=>e.removeAttribute('data-oracle-probe'));
   const root=document.querySelector(selector);
   const probes=scene<0?{root:'.hero',heading:'.hero h1','primary-action':'.hero-actions .button','summary-card':'.artifact-stage',status:'.hero-description'}:{root:'.legend-viewer',heading:`#legend-scene-${scene} h3`,'primary-action':'#legend-next','summary-card':`#legend-scene-${scene} .legend-full-prose`,status:'.legend-chapter-track'};
   for(const [key,s]of Object.entries(probes)){const e=document.querySelector(s);if(!e)throw Error(s);e.dataset.oracleProbe=key;}
   window.scrollTo({top:root.getBoundingClientRect().top+scrollY-document.querySelector('#site-header').offsetHeight-12,behavior:'instant'});
  },{selector,scene});
  await page.waitForTimeout(150);
  const evidence=await collectPageEvidence(page),clipped=findClippedProbes(evidence.dom_facts);
  const filename=`${width}x${height}-${scene<0?'hero':'scene-'+scene}.png`;await page.screenshot({path:fileURLToPath(new URL(filename,out))});
  captures.push({scene,clipped,...evidence,screenshot:filename});
 }
 results.push({width,height,gate:gateResult,a11y:a11yResult,a11yLog:logs,sections,captures});await page.close();
}
const source=await readFile(new URL('tools/taste-oracle/capture.mjs',taste));
await writeFile(new URL('results.json',out),JSON.stringify({method:'Actual TasteCheck collectPageEvidence + findClippedProbes and upstream browser audits, applied by KELD adapter. Not a paired-panel oracle release certification.',captureSourceSha256:createHash('sha256').update(source).digest('hex'),results},null,2)+'\n');
console.log(results.map(r=>({viewport:`${r.width}x${r.height}`,gate:r.gate.verdict,a11y:r.a11y,captures:r.captures.map(c=>({scene:c.scene,clipped:c.clipped}))})));
}finally{await browser.close();}
