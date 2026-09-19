// Bounded-v3 output only. Open questions: BOUNDED-V3-READINESS.md.
import assert from 'node:assert/strict';
import {readdirSync,lstatSync,statfsSync} from 'node:fs';
import {join} from 'node:path';
import {durableWrite as write} from './live.mjs';
export const MAX_OUTPUT_BYTES=32*1024**2,FINAL_RESERVE_BYTES=8*1024**2;
export function outputFootprint(directory){
 let total=0,entries=0;const visit=path=>{assert.ok(++entries<=4096,'output entry ceiling');const s=lstatSync(path);assert.ok(!s.isSymbolicLink(),'output symlink forbidden');assert.ok(s.isFile()||s.isDirectory(),'output file kind');total+=Math.max(s.size,s.blocks*512);assert.ok(Number.isSafeInteger(total),'output byte overflow');if(s.isDirectory())for(const name of readdirSync(path))visit(join(path,name));};visit(directory);return total;
}
export function budgetWrite(directory,name,value){
 assert.match(name,/^[A-Za-z0-9_-]+\.json$/);const final=['GENERATION-SEAL.json','RESULTS.json'].includes(name),bytes=Buffer.byteLength(JSON.stringify(value)+'\n'),block=Math.max(4096,Number(statfsSync(directory).bsize));
 assert.ok(Number.isSafeInteger(block)&&block>0,'output filesystem allocation unit');const projected=Math.ceil(bytes/block)*block+block,used=outputFootprint(directory),limit=final?MAX_OUTPUT_BYTES:MAX_OUTPUT_BYTES-FINAL_RESERVE_BYTES;
 assert.ok(!final||projected<=FINAL_RESERVE_BYTES,'final artifact exceeds reserved eight MiB');assert.ok(used+projected<=limit,'bounded output budget exhausted');write(directory,name,value);
}
