import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {launchBrowser} from './browser.mjs';
import {serviceToken} from '../src/identity.mjs';
import {operatorRequest,operatorHeaders} from './operator.mjs';
const c=JSON.parse(await readFile('.runtime/config.json'));
for(let i=0;i<30;i++){try{if((await fetch(c.origin+'/health')).ok)break}catch{}await new Promise(r=>setTimeout(r,500));if(i===29)throw Error('Fresh application did not become ready')}
const headers=await operatorHeaders(c);assert.equal((await operatorRequest('/admin/realms/auth-https',{origin:c.operatorOrigin,headers})).status,200);
const {access_token}=await serviceToken(c);const machine=await fetch(c.origin+'/api/document',{headers:{Authorization:'Bearer '+access_token}});assert.equal(machine.status,200);assert.equal((await machine.json()).principal_kind,'service');
const browser=await launchBrowser();try{const page=await browser.newPage();await page.goto(c.origin+'/document');await page.locator('#username').fill('alice');await page.locator('#password').fill(c.userPassword);await page.locator('#kc-login').click();await page.waitForURL(c.origin+'/document');assert.equal(JSON.parse(await page.locator('body').innerText()).principal_kind,'human')}finally{await browser.close()}
console.log('Fresh browser and service positive controls passed.');
