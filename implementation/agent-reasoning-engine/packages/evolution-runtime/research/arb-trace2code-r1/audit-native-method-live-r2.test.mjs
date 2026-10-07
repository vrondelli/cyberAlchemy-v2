// No providers/labels; exact audit equivalence and synthetic corruption checks.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R2.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {checkCanonicalObservation} from './audit-native-method-live-r2.mjs';
import {createHash} from 'node:crypto';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
test('r2 audit changes only exact campaign root/request identity/open-question owner',()=>{
 const expected=read('audit-native-method-live-r1.mjs').replace('g01-native-method-live-r1-20261007','g01-native-method-live-r2-20261007')
  .replaceAll('G01-NATIVE-METHOD-LIVE-R1.json','G01-NATIVE-METHOD-LIVE-R2.json').replace("'g01-native-method-r1-'+n","'g01-native-method-r2-'+n");
 assert.equal(read('audit-native-method-live-r2.mjs'),expected);
});
test('r2 canonical audit rejects partial or corrupted method bytes',()=>{
 const bytes=Buffer.from('void f() {}'),sha=b=>createHash('sha256').update(b).digest('hex');
 const o={source_sha256:sha(bytes),method_source_sha256:sha(bytes),source_byte_start:0,source_byte_end:bytes.length,utf8:bytes.toString(),byte_count:bytes.length,complete_method:true};
 checkCanonicalObservation(o,bytes);assert.throws(()=>checkCanonicalObservation({...o,utf8:'void f()'},bytes));
 assert.throws(()=>checkCanonicalObservation({...o,source_byte_end:bytes.length-1},bytes));
});
