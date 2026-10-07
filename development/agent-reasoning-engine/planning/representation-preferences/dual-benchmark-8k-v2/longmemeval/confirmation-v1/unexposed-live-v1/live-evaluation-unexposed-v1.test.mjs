import assert from "node:assert/strict";
import {existsSync, mkdtempSync, readdirSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {executeEvaluation} from "./live-evaluation-unexposed-v1.mjs";

test("review failure occurs before output creation or provider construction", async()=>{
  const root=mkdtempSync(join(tmpdir(),"unexposed-eval-review-"));let providers=0;
  try{await assert.rejects(executeEvaluation("missing","missing","longmemeval-unexposed-evaluation-r1",{verify:()=>{throw Error("review-invalid")},makeProviders:()=>{providers++},output_root:root}),/review-invalid/);assert.equal(providers,0);assert.deepEqual(readdirSync(root),[]);}finally{rmSync(root,{recursive:true,force:true});}
});

test("single-use runner writes bounded start and terminal receipts with injected zero-network effects",async()=>{
  const root=mkdtempSync(join(tmpdir(),"unexposed-eval-run-")),run="longmemeval-unexposed-evaluation-r2";let providers=0;
  const generationResults=[0,1,2,3].map(index=>({question_id:String(index),usage:{prompt_tokens:20,completion_tokens:4,total_tokens:24}}));
  const evaluation={totals:{control:{completed:4,valid_judgments:0,correct:0,generation_tokens:48,judge_tokens:0,total_tokens:48},treatment:{completed:4,valid_judgments:0,correct:0,generation_tokens:48,judge_tokens:0,total_tokens:48}},usage:{prompt_tokens:0,completion_tokens:0,total_tokens:0},unknown_usage:false,persistence_failure:false,health_stop:null,held_tokens:0,judge_calls:0};
  const verified={freeze:{tokenizer_timeout_ms:10000},freeze_sha256:"a".repeat(64),review_sha256:"b".repeat(64),seal_file_sha256:"c".repeat(64),seal:{result:{results:generationResults}},scorer:{score:async()=>evaluation}};
  const provider={meter:Object.assign(async()=>{throw Error("not called")},{settle:async()=>({settled:true})}),generate:Object.assign(async()=>{throw Error("not called")},{settle:async()=>({settled:true})})};
  try{const receipt=await executeEvaluation("package","review",run,{verify:()=>verified,makeProviders:()=>{providers++;return provider},output_root:root});assert.equal(receipt.status,"scored");assert.equal(providers,1);assert.equal(receipt.automatic_retries,0);assert.ok(existsSync(join(root,run,"STARTED.json")));assert.ok(existsSync(join(root,run,"EVALUATION-SEAL.json")));await assert.rejects(executeEvaluation("package","review",run,{verify:()=>verified,makeProviders:()=>provider,output_root:root}),/single-use/);}finally{rmSync(root,{recursive:true,force:true});}
});
