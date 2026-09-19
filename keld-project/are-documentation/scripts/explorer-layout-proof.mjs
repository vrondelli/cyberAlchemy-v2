import {engineNodes} from '../src/engineGraph.ts';
import {serveBuild} from './serve-build.mjs';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {featureMaps} from '../src/featureMaps.ts';
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require('/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');}
const output=resolve('evidence/explorer-layout');mkdirSync(output,{recursive:true});
const server=await serveBuild(resolve('dist')),checks=[],errors=[];let browser;
const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);console.log('PASS '+name);};
try{
 browser=await pw.chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 for(const [width,height] of [[1906,883],[1440,900],[390,844]]){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.url+'?benchmark=1#view=continuity&feature=concepts',{waitUntil:'networkidle'});await page.waitForTimeout(300);
 const geometry=await page.evaluate(()=>({canvas:document.querySelector('.react-flow').getBoundingClientRect().height,header:document.querySelector('.topbar').getBoundingClientRect().height,overflow:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth}));
 check(`${width}: viewport has no page overflow`,!geometry.overflow);
 check(`${width}: canvas space target`,geometry.canvas>=(height-geometry.header)*(width>700?.75:.48));
 if(width<=700)await page.getByRole('button',{name:'Show navigation',exact:true}).click();
 const nav=page.getByRole('navigation',{name:'Explore workflows'});
 check(`${width}: four workflows are directly available`,await nav.locator('summary').count()===4);
 for(const summary of await nav.locator('summary').all())await summary.click();
 for(const id of Object.keys(featureMaps)){
  await nav.locator(`a[href$="feature=${id}"]`).first().click();await page.locator(`[data-feature="${id}"]`).waitFor();
  check(`${width}: ${id} reachable in shared graph`,await page.locator('.react-flow').count()===1&&await page.locator('.react-flow__node-engine').count()===engineNodes.length);
 }
 await page.waitForTimeout(350);
 const before=await page.evaluate(()=>{window.__ARE_PERF__={};window.graphBefore=document.querySelector('.react-flow');return document.querySelector('.react-flow__viewport').getAttribute('style');});
 const sidebar=page.getByRole('complementary',{name:'Engine navigation'});await sidebar.evaluate(el=>{el.scrollTop=0;});const box=await sidebar.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+50);await page.mouse.wheel(0,1500);await page.waitForTimeout(300);
 const scroll=await page.evaluate(()=>({top:document.querySelector('.properties').scrollTop,y:scrollY,viewport:document.querySelector('.react-flow__viewport').getAttribute('style'),same:window.graphBefore===document.querySelector('.react-flow'),renders:window.__ARE_PERF__?.['app.render']??0}));
 check(`${width}: sidebar scroll is isolated`,scroll.top>0&&scroll.y===0&&scroll.viewport===before&&scroll.same&&scroll.renders===0);
 const areaBefore=await page.locator('.react-flow').boundingBox();await page.getByRole('button',{name:'Hide navigation',exact:true}).click();await page.waitForTimeout(200);const areaAfter=await page.locator('.react-flow').boundingBox();
 check(`${width}: hiding navigation increases canvas area`,areaAfter.width*areaAfter.height>areaBefore.width*areaBefore.height);
 check(`${width}: hiding navigation retains canvas`,await page.evaluate(()=>window.graphBefore===document.querySelector('.react-flow')));
 await page.getByRole('button',{name:'Show navigation',exact:true}).click();check(`${width}: navigation can reopen`,await sidebar.isVisible());
 await page.screenshot({path:resolve(output,`explorer-${width}.png`)});await page.close();
 }
 check('no browser errors',errors.length===0);
}catch(e){errors.push(String(e));console.error(e);process.exitCode=1;}finally{writeFileSync(resolve(output,'results.json'),JSON.stringify({status:errors.length?'FAIL':'PASS',checks,errors},null,2)+'\n');await browser?.close();await server.close();}
