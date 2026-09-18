import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {serveBuild} from './serve-build.mjs';
import {routeAssets} from './check-download-budget.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const budget=JSON.parse(readFileSync(resolve(root,'performance-budget.json'),'utf8'));
const manifest=JSON.parse(readFileSync(resolve(root,'dist/.vite/manifest.json'),'utf8'));
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');}
const preview=await serveBuild(resolve(root,'dist'));let browser;
const results=[],errors=[];
try{
 browser=await pw.chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 for(const route of budget.routes){
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),requested=new Set();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{const path=new URL(r.url()).pathname.slice(1);if(/\.(js|css)$/.test(path)){requested.add(path);if(!r.ok())errors.push(`${r.status()} ${path}`);}});
  await page.goto(preview.url+route.hash,{waitUntil:'networkidle'});
  const selector=route.name==='introduction'?'.continuous-intro':route.name==='documentation'?'.manual-home':'.react-flow__node-documentation';
  await page.locator(selector).first().waitFor();
  const expected=routeAssets(manifest,route.roots),actual=[...requested].sort();
  const passed=JSON.stringify(actual)===JSON.stringify(expected);
  results.push({route:route.name,expected,actual,passed});if(!passed)throw Error(`Initial asset closure differs: ${route.name}`);
  // Exercise loading the other lazy page after a cold documentation entry.
  if(route.name==='documentation'){
   await page.locator('.topbar').getByRole('link',{name:'Introduction',exact:true}).click();await page.locator('.continuous-intro').waitFor();
   await page.locator('.topbar').getByRole('link',{name:'Explore the engine',exact:true}).click();await page.locator('.react-flow').waitFor();
  }
  console.log(`PASS ${route.name}: browser requested exactly the budgeted JS/CSS assets`);await page.close();
 }
 if(errors.length)throw Error(errors.join('\n'));
}catch(error){errors.push(String(error));process.exitCode=1;console.error(error);}finally{
 writeFileSync(resolve(root,'evidence/performance/download-browser.json'),JSON.stringify({status:errors.length?'FAIL':'PASS',results,errors},null,2)+'\n');
 await browser?.close();await preview.close();
}
