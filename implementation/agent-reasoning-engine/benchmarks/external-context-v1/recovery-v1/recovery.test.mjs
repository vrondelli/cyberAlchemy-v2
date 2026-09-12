import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createRecoveryController} from './recovery.mjs';
import {openContextRecycling,createStatelessRecyclingTransport} from '../../../packages/coding-agent-runtime/context-recycling.mjs';
const a='a'.repeat(64),b='b'.repeat(64),body='x'.repeat(1024)+'y'.repeat(100);
const page=({digest,offset,max_chars})=>({ok:true,output:{digest,offset,next_offset:Math.min(body.length,offset+max_chars),total_chars:body.length,text:body.slice(offset,offset+max_chars)}});
for(const count of [3,7])test(`historical ${count}-read loop returns first page only once`,()=>{
 const c=createRecoveryController();let calls=0;
 for(let i=0;i<count;i++){
  const notice=JSON.parse(c.notice({generation:1,history_ref:i?a:b}));assert.equal(notice.recovery.digest,b);
  const r=c.read({digest:b,offset:0,max_chars:1024},args=>{calls++;return page(args)});
  assert.equal(r.ok,i===0);
 }
 assert.equal(calls,1);assert.equal(c.read({digest:b,offset:1024,max_chars:1024},page).output.text,'y'.repeat(100));
 assert.equal(c.read({digest:b,offset:1124,max_chars:1024},()=>assert.fail()).output.eof,true);
});
test('stale handles, skips, malformed backend and generation progress',()=>{
 const c=createRecoveryController();c.notice({generation:1,history_ref:a});
 assert.equal(c.read({digest:b,offset:0,max_chars:10},()=>assert.fail()).ok,false);
 assert.equal(c.read({digest:a,offset:10,max_chars:10},()=>assert.fail()).ok,false);
 for(const alteration of [{digest:b},{next_offset:0},{total_chars:-1},{text:'bad'},{next_offset:2000}])assert.throws(()=>c.read({digest:a,offset:0,max_chars:10},args=>({ok:true,output:{...page(args).output,...alteration}})),/invalid archive/);
 assert.equal(c.snapshot().recovery.next_offset,0);
 c.read({digest:a,offset:0,max_chars:10},page);c.notice({generation:2,history_ref:b});assert.equal(c.snapshot().recovery.next_offset,0);
 c.notice({generation:3,history_ref:a});assert.equal(c.snapshot().recovery.next_offset,10);
 assert.throws(()=>c.notice({generation:2,history_ref:b}),/generation/);
});
test('source index is bounded and contains only successful read metadata',()=>{
 const c=createRecoveryController();
 const event=i=>({tool:'read_file',arguments:{path:`src/${i}.js`},result:{ok:true,output:{path:`src/${i}.js`,start_line:1,end_line:10,source_sha256:a,utf8:'secret source'}}});
 for(let i=0;i<20;i++)c.observe(event(i));c.observe(event(19));c.observe({...event(99),result:{...event(99).result,ok:false}});
 const s=c.snapshot();assert.equal(s.inspected_source_ranges.length,16);assert.equal(s.omitted_ranges,4);assert.equal(s.inspected_source_ranges[0].path,'src/4.js');assert.ok(!JSON.stringify(s).includes('secret source'));
});
test('real recycler history digest churn preserves anchored archive and cursor',async()=>{
 const dir=mkdtempSync(tmpdir()+'/are-recovery-');mkdirSync(dir+'/fixture');let recycler;
 try{
  const transport=createStatelessRecyclingTransport({adapter_id:'recovery-test',source_ref:'recovery.test.mjs',maximum_output_tokens:100,measure_request:async({prompt})=>prompt.includes('PRESSURE_MARKER')?12000:100,request_once:async()=>({final_bytes:'{"message":{"role":"assistant","content":"ok"}}'})});
  recycler=openContextRecycling({transport,fixture_root:dir+'/fixture',scope:{request:'recovery'},options:{directory:dir+'/state',context_limit:16384,recycle_at:12000,safety_margin:1000,state:{objective:'recovery',constraints:[],completed:[],pending:[],facts:[],lessons:[],evidence_refs:['test']}}});
  const c=createRecoveryController(),metas=[];let history=[];
  const render=(visible,meta)=>{metas.push(meta);return JSON.stringify({visible,notice:c.notice(meta)});};
  await recycler.generate({history,run_id:'test',render});history.push({role:'user',content:'PRESSURE_MARKER'+'q'.repeat(3000)});recycler.completeStep(history,false);
  await recycler.generate({history,run_id:'test',render});assert.equal(c.snapshot().generation,1);const anchor=c.snapshot().recovery.digest;
  recycler.beforeTool();const p=c.read({digest:anchor,offset:0,max_chars:1024},args=>recycler.readEvidence(args));assert.equal(p.ok,true);
  history.push({role:'assistant',content:'next'});recycler.completeStep(history,false);
  await recycler.generate({history,run_id:'test',render});assert.notEqual(metas.at(-1).history_ref,anchor);assert.equal(c.snapshot().recovery.digest,anchor);
  recycler.beforeTool();const next=c.read({digest:anchor,offset:1024,max_chars:1024},args=>recycler.readEvidence(args));assert.equal(next.output.offset,1024);assert.notEqual(next.output.text,p.output.text);recycler.completeStep(history,true);
 }finally{recycler?.close();rmSync(dir,{recursive:true,force:true});}
});
