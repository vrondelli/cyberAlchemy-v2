import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const require=createRequire(resolve(root,'../video/package.json')),sharp=require('sharp');
const source=resolve(root,'source-assets/cyber-engine'),destination=resolve(root,'public/assets/cyber-engine');
mkdirSync(destination,{recursive:true});const assets=[];
for(const name of ['base','block','intake','assembled','brain']){
 const input=readFileSync(resolve(source,`${name}.png`));
 for(const size of [384,768]){
 const file=size===768?`${name}.webp`:`${name}-${size}.webp`;
 const output=await sharp(input).resize(size,size,{fit:'inside',withoutEnlargement:true}).webp({quality:85,alphaQuality:100,effort:4}).toBuffer();
 const info=await sharp(output).metadata();if(!info.hasAlpha)throw Error(`Transparency lost: ${name}`);
 writeFileSync(resolve(destination,file),output);
 assets.push({file,source:`source-assets/cyber-engine/${name}.png`,sourceBytes:input.length,bytes:output.length,width:info.width,height:info.height,sourceSha256:createHash('sha256').update(input).digest('hex'),sha256:createHash('sha256').update(output).digest('hex')});
 }
}
writeFileSync(resolve(destination,'manifest.json'),JSON.stringify({schema:'are.hero-assets/v1',settings:{widths:[384,768],quality:85,alphaQuality:100,effort:4},assets,openQuestions:'PAGE-PERFORMANCE.md#open-questions'},null,2)+'\n');
console.log(`Hero images: ${assets.reduce((n,a)=>n+a.bytes,0)} bytes (source ${[...new Map(assets.map(a=>[a.source,a.sourceBytes])).values()].reduce((n,b)=>n+b,0)})`);
