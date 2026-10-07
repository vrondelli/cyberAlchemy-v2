// Open Questions: evidence/G02-TYPED-NAVIGATION-R1.json.
import {test} from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import {createTypedNavigation,parseTypedSource} from './typed-navigation-r1.mjs';
import {observationItems} from '../../../../benchmarks/contextbench-v1/delivery.mjs';
const source='class Service:\n    def run(self):\n        return 1\n\ndef run():\n    return 2\n';
const snapshot={path:'service.py',utf8:source,source_sha256:createHash('sha256').update(source).digest('hex')};
const args={path:'service.py',query:'run',kind:'function',offset:0,limit:1};
test('typed metadata pages functions without acquiring source',async()=>{
 const navigate=createTypedNavigation({getObservedSnapshot:()=>snapshot});const first=await navigate(args);
 assert.equal(first.ok,true);assert.equal(first.output.total,2);assert.equal(first.output.next_offset,1);
 assert.equal(first.output.definitions[0].qualified_name,'Service::run');
 assert.deepEqual(first.output.definitions[0].read_file_args,{path:'service.py',start_line:2,line_count:2,revision:'base'});
 assert.deepEqual(observationItems({id:'d1',function:{name:'find_definitions'}},first),[]);
 const second=await navigate({...args,offset:1});assert.equal(second.output.next_offset,null);
 assert.notEqual(first.output.definitions[0].id,second.output.definitions[0].id);
});
test('unobserved or invalid-hash source is inaccessible',async()=>{
 assert.equal((await createTypedNavigation({getObservedSnapshot:()=>null})(args)).ok,false);
 assert.equal((await createTypedNavigation({getObservedSnapshot:()=>({...snapshot,utf8:'changed'})})(args)).ok,false);
});
test('closed arguments, traversal, limit and unknown kind rejected',async()=>{
 const n=createTypedNavigation({getObservedSnapshot:()=>snapshot});
 for(const change of [{extra:1},{path:'../service.py'},{limit:11},{kind:'method'},{offset:-1},{query:null}])
  assert.equal((await n({...args,...change})).ok,false);
});
test('unsupported language retains ordinary-tool fallback without guessed index',async()=>{
 const s={...snapshot,path:'service.go'};const n=createTypedNavigation({getObservedSnapshot:()=>s});
 assert.equal((await n({...args,path:s.path})).error,'navigation.unsupported-language-use-existing-source-tools');
});
test('parse errors yield no approximate definitions',async()=>{
 const n=createTypedNavigation({getObservedSnapshot:()=>snapshot,parse:()=>({status:'parse-error'})});
 assert.equal((await n(args)).ok,false);
});
test('cache keys bind exact source identity',async()=>{
 let count=0;const n=createTypedNavigation({getObservedSnapshot:()=>snapshot,parse:(s,l)=>{count++;return parseTypedSource(s,l);}});
 await n(args);await n({...args,query:'Service'});assert.equal(count,1);
});
test('class recommendation is bounded and not entire-class acquisition',async()=>{
 const n=createTypedNavigation({getObservedSnapshot:()=>snapshot});const r=await n({...args,kind:'class',query:''});
 assert.equal(r.output.definitions[0].kind,'class');assert.equal(r.output.definitions[0].read_file_args.line_count,3);
});
