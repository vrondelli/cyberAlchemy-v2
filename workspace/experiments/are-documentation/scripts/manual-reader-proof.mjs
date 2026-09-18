import {serveBuild} from './serve-build.mjs';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),output=resolve(root,'evidence/manual-reader');mkdirSync(output,{recursive:true});
const require=createRequire(import.meta.url);let pw;try{pw=require('playwright');}catch{pw=require(process.env.ARE_PLAYWRIGHT_ROOT??'/home/vrondelli/.local/share/are-workspace/browser-tests/node_modules/playwright');}
const server=await serveBuild(resolve(root,'dist'));let browser;const checks=[],errors=[];
const check=(name,ok)=>{if(!ok)throw Error(name);checks.push(name);console.log('PASS '+name);};
try{
 browser=await pw.chromium.launch({headless:true,executablePath:process.env.ARE_CHROMIUM??'/home/vrondelli/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome'});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 await page.goto(server.url+'#view=article&doc=concepts',{waitUntil:'networkidle'});
 const nav=page.getByRole('navigation',{name:'Documentation navigation'}),toc=page.getByRole('navigation',{name:'On this page'});
 const columns=await Promise.all([nav,page.locator('.manual-page>article'),page.locator('.manual-contents')].map(element=>element.boundingBox()));
 check('desktop separates guide navigation, article and contents',columns[0].x+columns[0].width<=columns[1].x&&columns[1].x+columns[1].width<=columns[2].x);
 check('navigation covers all nine guides once',await nav.locator('section a').count()===9);
 check('active guide is marked',await nav.getByRole('link',{name:'Understand the engine',exact:true}).getAttribute('aria-current')==='page');
 await page.screenshot({path:resolve(output,'desktop.png')});
 const target=toc.getByRole('link').first();const href=await target.getAttribute('href');await target.click();const anchor=new URLSearchParams(href.slice(1)).get('anchor');
 await page.waitForFunction(id=>document.activeElement?.id===id,anchor);
 check('contents link focuses its section',await page.evaluate(id=>document.activeElement.id===id,anchor));
 await page.getByRole('navigation',{name:'Guide sequence'}).getByRole('link',{name:/Next guide/}).click();await page.getByRole('heading',{name:'Follow an ARE workflow',exact:true}).waitFor();
 check('next guide follows the grouped reading order',new URLSearchParams((await page.evaluate(()=>location.hash)).slice(1)).get('doc')==='workflows');
 await nav.getByRole('searchbox',{name:'Find a guide',exact:true}).fill('recover');
 check('guide navigation search filters results',await nav.locator('section a').count()===1);
 await nav.getByRole('link',{name:'Operate and recover safely',exact:true}).click();await page.getByRole('heading',{name:'Operate and recover safely',exact:true}).waitFor();
 await nav.getByRole('searchbox',{name:'Find a guide',exact:true}).fill('zz-no-match');check('empty navigation search is explained',await nav.getByRole('status').count()===1);
 for(const width of [768,390]){
  const mobile=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(server.url+'#view=article&doc=working-memory',{waitUntil:'networkidle'});
  check(`${width}px navigation starts collapsed`,await mobile.locator('#manual-guide-list').isHidden());
  check(`${width}px contents starts collapsed`,await mobile.locator('.manual-contents details').getAttribute('open')===null);
  await mobile.getByRole('button',{name:'Browse guides +',exact:true}).click();
  const mobileNav=mobile.getByRole('navigation',{name:'Documentation navigation'});
  await mobileNav.getByRole('link',{name:'Learn from corrections',exact:true}).click();await mobile.getByRole('heading',{name:'Learn from corrections',exact:true}).waitFor();
  check(`${width}px selection closes navigation`,await mobile.locator('#manual-guide-list').isHidden());
  check(`${width}px reader stays within viewport`,await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await mobile.locator('.manual-contents summary').click();check(`${width}px contents remains available`,await mobile.getByRole('navigation',{name:'On this page'}).isVisible());
  await mobile.locator('.manual-contents summary').click();await mobile.screenshot({path:resolve(output,`reader-${width}.png`)});
  await mobile.close();
 }
 check('no browser errors',errors.length===0);
}catch(error){errors.push(String(error));process.exitCode=1;console.error(error);}finally{
 writeFileSync(resolve(output,'results.json'),JSON.stringify({status:errors.length?'FAIL':'PASS',checks,errors},null,2)+'\n');await browser?.close();await server.close();
}
