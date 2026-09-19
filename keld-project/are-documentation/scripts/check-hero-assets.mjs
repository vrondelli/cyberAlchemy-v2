import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..'),dir=resolve(root,'public/assets/cyber-engine');
const manifest=JSON.parse(readFileSync(resolve(dir,'manifest.json'),'utf8'));
if(manifest.assets.length!==10||new Set(manifest.assets.map(a=>a.file)).size!==10)throw Error('Expected five hero images in two sizes');
let bytes=0;
for(const a of manifest.assets){
 const source=readFileSync(resolve(root,a.source)),image=readFileSync(resolve(dir,a.file));
 if(createHash('sha256').update(source).digest('hex')!==a.sourceSha256)throw Error(`Source drift: ${a.source}`);
 if(createHash('sha256').update(image).digest('hex')!==a.sha256)throw Error(`Image drift: ${a.file}`);
 if(!image.equals(readFileSync(resolve(root,'dist/assets/cyber-engine',a.file))))throw Error(`Built asset differs: ${a.file}`);
 if(existsSync(resolve(root,'dist/assets/cyber-engine',a.file.replace(/-384(?=\.webp)/,'').replace('.webp','.png'))))throw Error('Source PNG leaked into runtime');
 bytes+=image.length;
}
if(bytes>1280*1024)throw Error('Hero family exceeds 1.25 MiB build budget');
mkdirSync(resolve(root,'evidence/performance'),{recursive:true});writeFileSync(resolve(root,'evidence/performance/hero-assets.json'),JSON.stringify({status:'PASS',familyBytes:bytes,budgetBytes:1280*1024,scope:'Both sizes combined; actual browser transfer selects one per image',assets:manifest.assets},null,2)+'\n');
console.log(`Hero family: ${(bytes/1024).toFixed(1)} / 1280 KiB, 10 verified runtime assets`);
