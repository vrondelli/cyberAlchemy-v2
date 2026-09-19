import {chromium} from 'playwright';
import {readFile,mkdir} from 'node:fs/promises';
import {browserOptions,browserHome} from './browser.mjs';
process.chdir(new URL('..',import.meta.url).pathname);
const c=JSON.parse(await readFile('.runtime/config.json'));
await mkdir(browserHome,{recursive:true,mode:0o700});
const context=await chromium.launchPersistentContext(browserHome+'manual-profile', {...browserOptions(false),viewport:{width:1200,height:900}});
const page=context.pages()[0]||await context.newPage();
await page.goto(c.origin);
if(await page.getByRole('link',{name:'Sign in again',exact:true}).count())await page.getByRole('link',{name:'Sign in again',exact:true}).click();
if(new URL(page.url()).origin===new URL(c.issuer).origin){await page.locator('#password').waitFor();if(await page.locator('#username').count())await page.locator('#username').fill('alice');await page.locator('#password').fill(c.userPassword);}
console.log('Opened the isolated HTTPS test browser. Alice is prefilled; click Sign in. Closing the browser ends this launcher.');
await new Promise(resolve=>context.on('close',resolve));
