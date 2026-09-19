// Parent denial checks; no provider access. Open questions: RANKED-READ-ACQUISITION-PROTOCOL-R2.md.
import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync,readdirSync} from 'node:fs';
import {join} from 'node:path';import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
for(const mode of ['unapproved','drift'])test('parent rejects '+mode+' review before creating output',t=>{
 const root=mkdtempSync(join(tmpdir(),'catalog-parent-'));t.after(()=>rmSync(root,{recursive:true,force:true}));
 const review=join(root,'review.json'),body=JSON.stringify({approved:false});writeFileSync(review,body);
 const pin=mode==='drift'?'0'.repeat(64):createHash('sha256').update(body).digest('hex');
 const child=spawnSync(process.execPath,[join(import.meta.dirname,'run-schema-agreement-initial-stage-r1.mjs'),join(root,'missing-freeze.json'),'unused',review,pin],{encoding:'utf8',timeout:10000});
 assert.equal(child.status,2);const result=JSON.parse(child.stdout);
 assert.equal(result.qualified,false);assert.match(result.error,mode==='drift'?/review-drift/:/exact-tokenizer-review/);
 assert.deepEqual(readdirSync(root),['review.json']);
});
