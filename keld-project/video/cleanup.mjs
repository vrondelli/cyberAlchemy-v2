import {rm,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {root,cache,source} from './common.mjs';
// Delete only this project's disposable cache after validated delivery exists.
const delivery=JSON.parse(await readFile(join(source,'exports/legend-v1/MANIFEST.json'),'utf8'));
const verification=JSON.parse(await readFile(join(root,'output/validation.json'),'utf8'));
if(delivery.files.length<10||verification.checks.length!==3||!verification.checks.every(c=>c.passed))throw Error('Validated delivery required before scratch cleanup');
await rm(cache,{recursive:true,force:true});
console.log('Removed only '+cache+'. Sources, editing files, tools and final exports retained.');
