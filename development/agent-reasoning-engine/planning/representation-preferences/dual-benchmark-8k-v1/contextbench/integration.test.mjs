import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { runPools } from '../pool.mjs';
import { runPair } from './run.mjs';
const read=p=>JSON.parse(readFileSync(p));
const source=read(new URL('./config.json',import.meta.url));
const manifest=()=>({id:'context-native-adapter-integration',global_workers:4,worker_limits:{contextbench:2,longmemeval:2},benchmark_budgets:{contextbench:192000,longmemeval:20},token_budget:192020,jobs:[{id:'context',benchmark:'contextbench',depends_on:[],reservation_tokens:192000,config:{task_id:'contextbench-1',repetition:1}},{id:'other',benchmark:'longmemeval',depends_on:[],reservation_tokens:20,config:{}}]});
const other=()=>({status:'completed',usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0},unknown_usage:false});
test('real pool configuration reaches native pair adapter and persists10 exact tokens without provider calls',async()=>{
  const directory=mkdtempSync(join(homedir(),'.dual8k-context-test-'));let calls=0;
  try{
    const state=await runPools({manifest:manifest(),directory,executePair:async(config)=>config.benchmark==='longmemeval'?other():runPair({...config,client_factory:()=>({}),run_task:async({cell,out})=>{
      calls++;assert.equal(cell.context_limit,8000);assert.equal(cell.limits.total_tokens,96000);assert.equal(cell.limits.output_cap,2048);assert.equal(cell.limits.compact_representation,calls===2);mkdirSync(out);
      return {status:'final_context_selected',native_export:{prediction:{}},receipts:[{kind:'model',dispatched:true,input_tokens:2,output_tokens:3}]};
    }})});
    assert.equal(calls,2);assert.equal(state.accounting.known_tokens,10);assert.equal(state.accounting.unknown_reserved_tokens,0);
    const pair=read(join(directory,'pairs/context/run/result.json'));assert.equal(pair.usage.total_tokens,10);assert.equal(pair.unknown_usage,false);assert.equal(pair.status,'completed');
    assert.equal(pair.arms.control.usage.total_tokens,5);assert.equal(pair.arms.treatment.usage.total_tokens,5);
  }finally{rmSync(directory,{recursive:true,force:true});}
});
test('unknown429 is retained, suppresses second arm, and reduces root future concurrency',async()=>{
  const directory=mkdtempSync(join(homedir(),'.dual8k-context-test-'));let calls=0;
  try{
    const state=await runPools({manifest:manifest(),directory,executePair:async(config)=>config.benchmark==='longmemeval'?other():runPair({...config,client_factory:()=>({}),run_task:async({out})=>{
      calls++;mkdirSync(out);return {status:'run_error',receipts:[{kind:'model',dispatched:true,status:429,provider_code:'1302'}]};
    }})});
    assert.equal(calls,1);assert.equal(state.accounting.known_tokens,0);assert.equal(state.accounting.unknown_reserved_tokens,192000);assert.equal(state.concurrency,2);
    const pair=read(join(directory,'pairs/context/run/result.json'));assert.equal(pair.unknown_usage,true);assert.equal(pair.provider_error_code,'1302');assert.equal(pair.conservative_total_tokens,8000);assert.equal(pair.arms.treatment.status,'not-started-after-provider-failure');
  }finally{rmSync(directory,{recursive:true,force:true});}
});
