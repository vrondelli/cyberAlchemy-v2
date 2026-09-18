import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {startPreview} from './preview.mjs';
import {output,json} from './common.mjs';
const server=await startPreview(0),url=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.KELD_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',headless:true,ignoreDefaultArgs:['--mute-audio'],args:['--no-sandbox','--disable-dev-shm-usage']});
const checks=[];
try{
 for(const width of [1440,390,280]){
  const page=await browser.newPage({viewport:{width,height:900}}),requests=[],errors=[];
  page.on('request',r=>requests.push(r.url()));page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(url,{waitUntil:'networkidle'});
  assert.equal(requests.filter(x=>x.endsWith('.mp4')).length,0,'no video requested before play');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  await page.screenshot({path:join(output,`preview-${width}.png`),fullPage:true});
  await page.locator('#play').click();await page.waitForFunction(()=>document.querySelector('video').currentTime>0.1,{},{timeout:15000});
  assert.equal(await page.locator('#play').isVisible(),false);
  assert.equal(await page.locator('video').evaluate(v=>v.videoWidth),1920);
  if(width===1440)await page.screenshot({path:join(output,'preview-playing.png')});
  await page.waitForFunction(()=>document.querySelector('video').textTracks[0]?.mode==='showing'&&document.querySelector('video').textTracks[0]?.cues?.length>0);
  assert.equal(await page.locator('video').evaluate(v=>v.muted),false);
  await page.locator('#sound').click();assert.equal(await page.locator('video').evaluate(v=>v.muted),true);await page.locator('#sound').click();
  await page.locator('#captions').click();assert.equal(await page.locator('video').evaluate(v=>v.textTracks[0].mode),'disabled');await page.locator('#captions').click();
  if(width===1440){const rms=await page.evaluate(async()=>{const v=document.querySelector('video'),ctx=new AudioContext();await ctx.resume();const src=ctx.createMediaElementSource(v),an=ctx.createAnalyser();src.connect(an);an.connect(ctx.destination);const data=new Float32Array(an.fftSize);let peak=0;return await new Promise(resolve=>{let n=0;const timer=setInterval(()=>{an.getFloatTimeDomainData(data);const rms=Math.sqrt(data.reduce((sum,x)=>sum+x*x,0)/data.length);peak=Math.max(peak,rms);if(++n===50){clearInterval(timer);resolve(peak);}},40);});});assert.ok(rms>0.0001,'browser must decode non-silent audio');}
  const duration=await page.locator('video').evaluate(v=>v.duration);assert.ok(Math.abs(duration-192)<0.1);
  await page.locator('#teaser').click();assert.ok(await page.locator('#play').isVisible());
  await page.locator('#play').click();await page.waitForFunction(()=>document.querySelector('video').currentTime>0.1,{},{timeout:15000});
  assert.ok(Math.abs(await page.locator('video').evaluate(v=>v.duration)-30)<0.1);
  await page.locator('video').evaluate(v=>v.pause());await page.locator('summary').click();await page.waitForFunction(()=>document.querySelector('#transcript').textContent.includes('He was known'));
  assert.equal(errors.length,0);checks.push({width,passed:true,noEagerVideo:true,fullAndTeaserPlay:true,transcript:true,subtitlesDefaultOn:true,soundControl:true});await page.close();
 }
 const response=await fetch(url+'/output/keld-legend-full.mp4',{headers:{range:'bytes=0-127'}});assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,128);
 await json(join(output,'preview-validation.json'),{checks,rangeRequests:true});console.log('Preview passed at 1440, 390 and 280 pixels, including actual video playback.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
