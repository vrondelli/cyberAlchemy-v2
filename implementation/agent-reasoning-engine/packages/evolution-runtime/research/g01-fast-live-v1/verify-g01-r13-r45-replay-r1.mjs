// Sealed, provider-free r44 -> r45 ledger replay. Does not export prompt or source text.
import {createHash} from "node:crypto";
import {readFileSync,readdirSync,writeFileSync} from "node:fs";
import {join,relative} from "node:path";
import {pathToFileURL} from "node:url";

const cold="/home/vlad_/are-benchmark-archive";
const oldRoot=join(cold,"g01-r13-r44-source-development/source");
const newRoot=join(cold,"g01-r13-r45-source-development/source");
const run=join(cold,"g01-r13-r2-terminal-run-20261002/campaign/typescript-material-7958c8a7/control/runs/00");
const receiptPath=join(cold,"g01-r13-r45-source-development/R45-SEALED-REPLAY.json");
const ledgerRel="development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-ledger-r1.mjs";
const testRel="development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-delivery-compact-recovery.test.mjs";
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const need=(value,reason)=>{if(!value)throw Error(`g01-r45-sealed-replay.${reason}`);};

async function main(){
 need(process.argv.length===2||process.argv.length===3&&process.argv[2]==="--write","arguments");
 const {bindSourceTree}=await import(pathToFileURL(join(oldRoot,
   "implementation/agent-reasoning-engine/packages/evolution-runtime/research/g01-fast-live-v1/prepare-campaign.mjs")).href);
 const before=bindSourceTree(oldRoot),after=bindSourceTree(newRoot);
 need(before.file_count===412&&before.tree_sha256==="034458ba51cf7b8b00873fda75f9d1c126f623e5ca0154bbef72388d7770f484"&&
   after.file_count===412&&after.tree_sha256==="f4a9a90677ccc71cc2353e056b2af56ee470013579015d34eb3578bdfd374173","source-trees");
 const oldMap=new Map(before.sources.map(row=>[relative(oldRoot,row.path),row.sha256]));
 const changed=after.sources.filter(row=>oldMap.get(relative(newRoot,row.path))!==row.sha256)
   .map(row=>relative(newRoot,row.path)).sort();
 need(changed.join() === [testRel,ledgerRel].sort().join(),"exact-delta");
 const eventsBytes=readFileSync(join(run,"events.jsonl"));
 const resultBytes=readFileSync(join(run,"result.json"));
 need(sha(eventsBytes)==="e2258b56c7066bcefe89a25d3ce500f3dda49a5fdd461cd1019195999a7da506"&&
   sha(resultBytes)==="d8588f8efe7a17401248c37efe4dbf9744d1439b506d5be77f57a83b7eb9a93b","raw-drift");
 const captures=eventsBytes.toString("utf8").trimEnd().split("\n").map(line=>JSON.parse(line))
   .filter(row=>row.kind==="request-capture").map(row=>row.capture);
 const result=JSON.parse(resultBytes);
 const snapshots=readdirSync(join(run,"snapshots")).filter(name=>name.endsWith(".json"))
   .sort().map(name=>JSON.parse(readFileSync(join(run,"snapshots",name))));
 need(captures.length===12&&result.receipts?.length===35&&snapshots.length===5,"replay-inputs");
 const inputs={captures,receipts:result.receipts,snapshots};
 const oldLedger=await import(pathToFileURL(join(oldRoot,ledgerRel)).href);
 const newLedger=await import(pathToFileURL(join(newRoot,ledgerRel)).href);
 let beforeError=null;
 try{oldLedger.buildCoverageLedger(inputs);}catch(error){beforeError=String(error.message);}
 need(beforeError==="frontier.revision-arguments","old-failure");
 const repaired=newLedger.buildCoverageLedger(inputs);
 need(repaired.schema_version==="are.receipt-coverage-ledger/v1"&&
   repaired.entries.length>0&&repaired.entries.every(entry=>
     ["base","current",null].includes(entry.source_revision)),"new-ledger");
 const receipt={schema_version:"are.g01-r13-r45-sealed-replay/v1",status:"source-replay-passed",
   r44_source_tree_sha256:before.tree_sha256,r45_source_tree_sha256:after.tree_sha256,
   changed_relative_paths:changed,old_failure:beforeError,new_ledger_entries:repaired.entries.length,
   sealed_events_sha256:sha(eventsBytes),sealed_control_result_sha256:sha(resultBytes),
   captures:captures.length,receipts:result.receipts.length,snapshots:snapshots.length,
   model_calls:0,gold_loaded:false,
   claim_ceiling:"Prospective source reliability replay on one exposed failed control; no r13 repair, fresh cohort qualification, quality, or superiority",
   open_questions:["Does r45 pass full pinned tests and source-only admission on a separately selected clean cohort?"]};
 const bytes=Buffer.from(JSON.stringify(receipt,null,2)+"\n");
 if(process.argv[2]==="--write")writeFileSync(receiptPath,bytes,{flag:"wx",mode:0o600});
 console.log(JSON.stringify({status:receipt.status,new_ledger_entries:receipt.new_ledger_entries,
   receipt_sha256:sha(bytes),...(process.argv[2]==="--write"?{receipt_path:receiptPath}:{})}));
}
main().catch(error=>{console.error(JSON.stringify({status:"verify-error",error:String(error.message)}));process.exitCode=2;});
