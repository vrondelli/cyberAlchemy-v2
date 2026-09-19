import {readFile} from 'node:fs/promises';
import {serviceToken} from '../src/identity.mjs';
process.chdir(new URL('..',import.meta.url).pathname);
const c=JSON.parse(await readFile('.runtime/config.json'));
const {access_token}=await serviceToken(c);
const r=await fetch(c.origin+'/api/document',{headers:{Authorization:`Bearer ${access_token}`}});
console.log(JSON.stringify({status:r.status,...await r.json()},null,2));
if(!r.ok)process.exitCode=1;
