// Full-console browser acceptance. Open questions: ../NATIVE-CONSOLE-PLAN.md.
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {startNativeConsole} from './native-console-server.mjs';
const {chromium}=await import(pathToFileURL(resolve(process.argv[2],'node_modules/playwright/index.mjs')));
const root=mkdtempSync('/tmp/ncb-'),config={schema_version:'are-native-console-config/v1',mode:'native-fixture',candidate:resolve(process.argv[4]),driver:resolve(process.argv[5]),state:resolve(root,'state'),runtime:resolve(root,'run'),static_root:resolve(process.argv[6]),port:0,max_tasks:2};
let app,browser;
try{
 app=await startNativeConsole(config);browser=await chromium.launch({executablePath:resolve(process.argv[3]),headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(app.origin);await page.getByRole('heading',{name:'Native tasks',exact:true}).waitFor();
 await page.getByRole('link',{name:'CyberAlchemy Orchestrator, open native tasks'}).click();assert.ok(page.url().endsWith('/native'));
 await page.getByRole('button',{name:'Review task',exact:true}).click();await page.getByRole('button',{name:'Launch fixture task'}).waitFor();
 await page.getByLabel('Title',{exact:true}).fill('Browser native check');assert.equal(await page.getByRole('button',{name:'Launch fixture task'}).count(),0);
 await page.getByRole('button',{name:'Review task',exact:true}).click();await page.getByRole('button',{name:'Launch fixture task'}).click();
 await page.getByRole('status').filter({hasText:'succeeded'}).waitFor({timeout:90000});
 assert.equal(app.snapshot().jobs.length,1);assert.equal(app.snapshot().jobs[0].fixture_provider_calls,1);
 await page.getByText('Verified result and receipt',{exact:true}).click();assert.ok((await page.locator('.native-history').innerText()).includes('completion_binding_digest'));
 await page.screenshot({path:resolve(process.argv[7],'native-console-desktop.png'),fullPage:true,animations:'disabled'});
 await page.reload();await page.getByRole('status').filter({hasText:'succeeded'}).waitFor();assert.equal(app.snapshot().jobs.length,1);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:resolve(process.argv[7],'native-console-mobile.png'),fullPage:true,animations:'disabled'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'MOBILE_HORIZONTAL_OVERFLOW');assert.deepEqual(errors,[]);
 console.log(JSON.stringify({status:'PASS',checks:['full console route and same-origin backend','editing invalidates review','browser review-launch-verified result','reload preserves one task','390px layout without horizontal overflow','no browser exceptions'],external_model_calls:0,open_questions_ref:'../NATIVE-CONSOLE-PLAN.md#open-questions'},null,2));
}finally{await browser?.close();await app?.close();rmSync(root,{recursive:true,force:true});}
