import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {writeFile} from 'node:fs/promises';
const require=createRequire(new URL('../../video/package.json',import.meta.url));const {chromium}=require('playwright-core');
const browser=await chromium.launch({executablePath:'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',args:['--no-sandbox']});const results=[];
try{for(const [width,height]of[[1280,720],[1366,768],[1366,650],[1536,730],[1536,864],[1920,1080],[1024,640],[390,844],[320,640],[640,360]]){
const p=await browser.newPage({viewport:{width,height}});await p.goto('http://127.0.0.1:4399/index.html');await p.addStyleTag({content:'html{scroll-behavior:auto!important}'});
const metric=await p.evaluate(()=>({header:document.querySelector('#site-header').getBoundingClientRect().height,sections:[...document.querySelectorAll('#studio-view>section')].map(e=>({id:e.id,height:Math.ceil(e.getBoundingClientRect().height)})),film:Math.ceil(document.querySelector('.legend-film').getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>innerWidth}));
const scenes=[];for(let i=0;i<6;i++){await p.locator(`#legend-chapter-${i}`).click();scenes.push(await p.evaluate(i=>{const r=document.querySelector('.legend-viewer').getBoundingClientRect();return {i,height:Math.ceil(r.height),top:Math.round(r.top),bottom:Math.round(r.bottom)};},i));}
await p.locator('#legend-expand').click();const cinema=await p.evaluate(()=>{const a=document.querySelector('#cinema-close').getBoundingClientRect(),b=document.querySelector('#cinema-next').getBoundingClientRect(),c=document.querySelector('.cinema-caption');return {closeVisible:a.top>=0&&a.bottom<=innerHeight,nextVisible:b.top>=0&&b.bottom<=innerHeight,scroll:c.scrollHeight-c.clientHeight};});await p.keyboard.press('Escape');
assert.equal(metric.overflow,false,`${width} horizontal overflow`);
if(width>=1000){
 for(const section of metric.sections.filter(x=>x.id!=='legend')) assert.ok(section.height<=height-metric.header-12,`${width}x${height} ${section.id} height ${section.height}`);
 assert.ok(metric.film<=height-metric.header-12,`${width} film fit`);
 for(const scene of scenes){assert.ok(scene.height<=height-metric.header-12,`${width} scene ${scene.i} fit`);assert.ok(scene.top>=metric.header && scene.bottom<=height,`${width} scene ${scene.i} visible after click`);}
}
assert.ok(cinema.closeVisible&&cinema.nextVisible,`${width} cinema controls`);
results.push({width,height,...metric,scenes,cinema});await p.close();}
await writeFile(new URL('layout-results.json',import.meta.url),JSON.stringify(results,null,2));console.log(results.map(r=>({size:`${r.width}x${r.height}`,budget:r.height-r.header,sections:r.sections,film:r.film,sceneMax:Math.max(...r.scenes.map(s=>s.height)),cinema:r.cinema,overflow:r.overflow})));
}finally{await browser.close();}
