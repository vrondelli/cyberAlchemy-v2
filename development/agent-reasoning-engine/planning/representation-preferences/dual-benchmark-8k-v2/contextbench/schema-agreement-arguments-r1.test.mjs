// Open questions: RANKED-SCHEMA-AGREEMENT-PROTOCOL-R1.md.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {join} from 'node:path';
import Ajv from '../../../../../../implementation/agent-reasoning-engine/benchmarks/external-context-v1/node_modules/ajv/dist/ajv.js';
import {schemas} from '../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/repository-tools.mjs';
import {rankedSearchSchema,validateSearchStructure,classifySearchArguments} from './schema-agreement-arguments-r1.mjs';
import {classifySearchArguments as oldClassify} from './ranked-read-arguments-r1.mjs';
const args=mode=>({query:'evidence',revision:'base',path_prefix:'',offset:0,limit:5,...(mode===undefined?{}:{mode})});
const advertised=new Ajv({strict:true,allErrors:true}).compile(structuredClone(rankedSearchSchema)),native=new Ajv({strict:true,allErrors:true}).compile(schemas.search);
const variants={query:['','x','a'.repeat(4096),'a'.repeat(4097),null,5,[],{}],revision:['base','current','other',null,5,[],{}],path_prefix:['','src','a'.repeat(4096),'a'.repeat(4097),null,5,[],{}],offset:[-1,0,1,1.5,'0',null,[],{}],limit:[-1,0,1,5,6,30,31,1.5,'5',null,[],{}],mode:['literal','ranked','other','',null,5,[],{}]};
test('every field: missing, types, enums, boundaries and unknown keys agree with independent prior semantics',()=>{
 let count=0;
 for(const mode of [undefined,'literal','ranked']){
  const cases=[args(mode),null,[],true,{}, {...args(mode),extra:true}];
  for(const field of Object.keys(variants)){
   const missing=args(mode);delete missing[field];cases.push(missing);
   for(const value of variants[field])cases.push({...args(mode),[field]:value});
  }
  for(const a of cases){
   const before=structuredClone(a);let expected=false;
   if(a&&typeof a==='object'&&!Array.isArray(a)){
    if(!Object.hasOwn(a,'mode')||a.mode==='literal'){const copy={...a};delete copy.mode;expected=native(copy);}
    else if(a.mode==='ranked')expected=oldClassify(a).kind==='ranked';
   }
   assert.equal(advertised(a),expected,JSON.stringify(a)?.slice(0,180));
   assert.equal(validateSearchStructure(a).ok,expected);assert.equal(classifySearchArguments(a).kind!=='reject',expected);assert.deepEqual(a,before);count++;
  }
 }
 assert.equal(count,189);
});
test('pinned recorded replay: 30 rejected by advertised and runtime schema, 20 successful preserved',()=>{
 const c=import.meta.dirname,review=JSON.parse(readFileSync(join(c,'ranked-read-production-live-r1/RESULT-REVIEW-R1.json'))),pins=new Map(review.source_bindings.map(b=>[b.path,b.sha256]));assert.equal(review.approved,true);
 let requested=0,rejected=0,accepted=0;
 for(let i=0;i<4;i++){
  const p=join(c,'ranked-read-production-live-r1/runs_root',String(i).padStart(2,'0'),'events.jsonl'),bytes=readFileSync(p);assert.equal(createHash('sha256').update(bytes).digest('hex'),pins.get(p));
  for(const line of bytes.toString().trim().split('\n')){const e=JSON.parse(line);if(e.kind!=='source-tool-result'||e.call.function.name!=='search')continue;const a=JSON.parse(e.call.function.arguments);if(a.mode!=='ranked')continue;requested++;
   const valid=e.output.ok===true;assert.equal(advertised(a),valid);assert.equal(validateSearchStructure(a).ok,valid);assert.equal(classifySearchArguments(a).kind==='ranked',valid);if(valid)accepted++;else rejected++;
  }
 }
 assert.deepEqual({requested,rejected,accepted},{requested:50,rejected:30,accepted:20});
});
test('semantic byte and UTF8 constraints remain distinct and bounded',()=>{
 for(const query of ['é'.repeat(2049),'\ud800']){const a={...args('ranked'),query};assert.equal(validateSearchStructure(a).ok,true);assert.equal(classifySearchArguments(a).kind,'reject');}
 assert.equal(classifySearchArguments({...args('ranked'),query:'é'.repeat(2048)}).kind,'ranked');
 const oversized=classifySearchArguments({...args('ranked'),extra:'secret'.repeat(2000)}).result;assert.deepEqual(oversized.issues,[{code:'input-size',path:''}]);assert.ok(!JSON.stringify(oversized).includes('secret'));
 const a=args('ranked');for(let i=0;i<70;i++)a['é'.repeat(20)+i]=true;
 const r=classifySearchArguments(a).result;assert.equal(r.total_issues,70);assert.ok(r.issues.length<=32);assert.ok(Buffer.byteLength(JSON.stringify(r))<=8192);
});
test('schema frozen, successful input copied, literal mode stripped only after validation',()=>{
 assert.throws(()=>{rankedSearchSchema.properties.limit.maximum=1000;});
 for(const mode of [undefined,'literal','ranked']){const a=args(mode),r=classifySearchArguments(a);assert.equal(r.kind,mode==='ranked'?'ranked':'literal');const expected={...a};if(mode!=='ranked')delete expected.mode;assert.deepEqual(r.args,expected);r.args.limit=1;assert.equal(a.limit,5);}
});
