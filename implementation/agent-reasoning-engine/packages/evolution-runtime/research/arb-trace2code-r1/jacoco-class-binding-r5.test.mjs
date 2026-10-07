// Open Questions: G01-JACOCO-CLASS-IDENTITY-R5.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {classId,classInventory,bindClassInfo} from './jacoco-class-binding-r5.mjs';

const root='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r4-20261006';
function fixture(id){const p=join(root,id),result=JSON.parse(readFileSync(join(p,'RESULT.json')));assert.ok(result.operations.some(o=>o.label==='CLASSINFO'));return {p,result,inventory:classInventory(join(p,'trusted-fixture',result.compiled_root)),instrumentation:JSON.parse(readFileSync(join(p,'INSTRUMENTATION.json'))),text:readFileSync(join(p,'CLASSINFO.stdout'),'utf8')};}

test('all reported Csv IDs reconstruct; synthetic methods unavailable not zero',()=>{
 const f=fixture('Defects4J-Csv-5'),rows=bindClassInfo(f.text,f.inventory,f.instrumentation);
 assert.equal(rows.length,f.inventory.length);
 const generated=rows.filter(r=>!r.analyzed);assert.equal(generated.filter(r=>r.method_count>0).length,2);
 assert.ok(generated.every(r=>r.class_id&&r.executable_lines===null&&r.line_coverage_available===false&&r.analysis_omission));
});
test('all1272 Closure classinfo CRC IDs match but full declared scope still rejects missing23 types',()=>{
 const f=fixture('Defects4J-Closure-5'),parsed=[...f.text.matchAll(/class 0x([a-f0-9]{16}) ([A-Za-z0-9_$/-]+)/g)];assert.equal(parsed.length,1272);
 for(const m of parsed)assert.equal(f.inventory.find(r=>r.path===m[2]+'.class').class_id,m[1]);
 assert.throws(()=>bindClassInfo(f.text,f.inventory,f.instrumentation),/declared-production-type-not-analyzed/);
});
test('every declared class stays required',()=>{const f=fixture('Defects4J-Closure-5');assert.throws(()=>bindClassInfo(f.text,f.inventory,{...f.instrumentation,classes:[...f.instrumentation.classes,'missing.Type']}),/declared-production/);});
test('classinfo ID mismatch rejects',()=>{const f=fixture('Defects4J-Cli-5');assert.throws(()=>bindClassInfo(f.text.replace(/0x[a-f0-9]{16}/,'0x0000000000000000'),f.inventory,f.instrumentation),/id-or-membership/);});
test('unexplained omitted class rejects',()=>{const f=fixture('Defects4J-Cli-5');const first=f.text.match(/^.*class 0x.*$/m)[0];assert.throws(()=>bindClassInfo(f.text.replace(first,''),f.inventory,f.instrumentation),/non-synthetic/);});
test('Java9 class ID compatibility is prospectively explicit',()=>{const f=fixture('Defects4J-Cli-5'),b=readFileSync(join(f.p,'trusted-fixture',f.result.compiled_root,f.inventory[0].path));const v9=Buffer.from(b),v8=Buffer.from(b);v9[6]=0;v9[7]=53;v8[6]=0;v8[7]=52;assert.equal(classId(v9),classId(v8));});
test('truncated non-class bytes reject',()=>{assert.throws(()=>classId(Buffer.from('not a class')),/class-header/);});
