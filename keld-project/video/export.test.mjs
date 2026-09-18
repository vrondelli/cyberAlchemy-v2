import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import {source,root,readJSON,json} from './common.mjs';
const directory=join(source,'exports',process.env.KELD_VIDEO_EXPORT_VERSION??'legend-v2');
const manifest=await readJSON(join(directory,'MANIFEST.json'));
for(const f of manifest.files){const bytes=await readFile(join(directory,f.file));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);}
const browser=await chromium.launch({executablePath:process.env.KELD_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',ignoreDefaultArgs:['--mute-audio'],args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage();await page.goto(pathToFileURL(join(directory,'index.html')).href);
 await page.locator('#teaser').click();await page.locator('#play').click();
 await page.waitForFunction(()=>document.querySelector('video').currentTime>0.2,{},{timeout:15000});
 await page.locator('video').evaluate(v=>{v.textTracks[0].mode='showing';});
 await page.waitForFunction(()=>document.querySelector('video').textTracks[0].cues?.length>0,{},{timeout:10000});
 assert.match(await page.locator('#transcript').textContent(),/He was known by many titles/);
 await json(join(root,'EXPORT-VALIDATION.json'),{destination:directory,files:manifest.files.length,allHashesMatch:true,offlinePlayback:true,offlineCaptions:true,offlineTranscript:true,openQuestionsRef:'README.md#operations-and-open-questions'});
 console.log('Export hashes, offline playback, captions and transcript passed.');
}finally{await browser.close();}
