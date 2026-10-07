// Provider-free replay of r13 pair-4's sealed control failure.
// Emits only structural metadata; no prompts, source, tool output, or credential.
import {createHash} from "node:crypto";
import {readFileSync, readdirSync, writeFileSync} from "node:fs";
import {join} from "node:path";
import {pathToFileURL} from "node:url";

const archive="/home/vlad_/are-benchmark-archive/g01-r13-r2-terminal-run-20261002";
const source="/home/vlad_/are-benchmark-archive/g01-r13-r44-source-development/source";
const pair=join(archive,"campaign/typescript-material-7958c8a7");
const run=join(pair,"control/runs/00");
const pins={
 pair:[join(pair,"PAIR-RESULT.json"),"5601d068edf9694a24c0115ca85b8145c867e2960ca47f4170e3f6877af30fa4"],
 result:[join(run,"result.json"),"d8588f8efe7a17401248c37efe4dbf9744d1439b506d5be77f57a83b7eb9a93b"],
 events:[join(run,"events.jsonl"),"e2258b56c7066bcefe89a25d3ce500f3dda49a5fdd461cd1019195999a7da506"]
};
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");
const need=(value,reason)=>{if(!value)throw Error(`g01-r13-frontier-replay.${reason}`);};
const readPinned=([path,digest])=>{const bytes=readFileSync(path);need(sha(bytes)===digest,"raw-drift");return bytes;};

async function main(){
 need(process.argv.length===2||process.argv.length===3&&process.argv[2]==="--write","arguments");
 const pairResult=JSON.parse(readPinned(pins.pair));
 const result=JSON.parse(readPinned(pins.result));
 need(pairResult.status==="unscored"&&pairResult.arms?.control?.error==="frontier.revision-arguments"&&
   result.status==="run_error"&&result.error==="frontier.revision-arguments","failure-binding");
 const events=readPinned(pins.events).toString("utf8").trimEnd().split("\n").map(line=>JSON.parse(line));
 const captures=events.filter(event=>event.kind==="request-capture").map(event=>event.capture);
 const snapshots=readdirSync(join(run,"snapshots")).filter(name=>name.endsWith(".json"))
   .sort().map(name=>JSON.parse(readFileSync(join(run,"snapshots",name))));
 need(captures.length===12&&result.receipts?.length===35&&snapshots.length===5,"replay-input-counts");
 const ledgerPath=join(source,"development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/bounded-archive-frontier-ledger-r1.mjs");
 const {buildCoverageLedger}=await import(pathToFileURL(ledgerPath).href);
 let replayError=null,firstFailureAt=null;
 for(let count=1;count<=captures.length;count++){
  try{buildCoverageLedger({captures:captures.slice(0,count),receipts:result.receipts,snapshots});}
  catch(error){
   const message=String(error.message);
   if(message==="frontier.revision-arguments"&&firstFailureAt===null)firstFailureAt=count;
   if(count===captures.length)replayError=message;
  }
 }
 need(replayError==="frontier.revision-arguments"&&firstFailureAt!==null,"failure-not-reproduced");
 const structural=[];
 for(const capture of captures){
  const body=JSON.parse(capture.prompt),calls=new Map();
  for(const message of body.messages){
   if(message.role==="assistant")for(const call of message.tool_calls??[])calls.set(call.id,call);
   if(message.role!=="tool")continue;
   const call=calls.get(message.tool_call_id);
   if(call?.function?.name!=="recover_archived_read")continue;
   const args=JSON.parse(call.function.arguments),output=JSON.parse(message.content);
   if(output.ok===true&&output.archive_origin){
    structural.push({call_id:call.id,argument_fields:Object.keys(args).sort(),
      requested_revision:args.revision??null,observation_revision:output.output?.source_revision??null,
      origin_matches:output.archive_origin.archive_sha256===args.archive_sha256&&
        output.archive_origin.observation_index===args.observation_index});
   }
  }
 }
 const unique=[...new Map(structural.map(row=>[row.call_id,row])).values()];
 need(unique.length===3&&unique.every(row=>row.requested_revision===null&&
   row.observation_revision==="base"&&row.origin_matches===true&&
   row.argument_fields.join()==="archive_sha256,observation_index"),
   "compact-recovery-mechanism");
 const receipt={schema_version:"are.g01-r13-r2-frontier-failure-replay/v1",
   status:"reproduced",pair_result_sha256:pins.pair[1],control_result_sha256:pins.result[1],
   events_sha256:pins.events[1],source_root:source,
   captures:captures.length,receipts:result.receipts.length,snapshots:snapshots.length,
   first_failure_capture_count:firstFailureAt,replayed_error:replayError,
   unique_successful_compact_recovery_calls:unique.length,
   compact_recovery_argument_fields:unique[0].argument_fields,
   recovered_observation_revision:unique[0].observation_revision,
   mechanism:"Coverage ledger requires args.revision even for compact immutable recovery, whose schema omits revision and whose source revision is bound by archive origin",
   model_calls:0,gold_loaded:false,
   claim_ceiling:"Reproduced r13 failure mechanism only; no r13 repair, prospective source qualification, or superiority",
   open_questions:["Does a separately versioned ledger guard preserve fail-closed behavior for ordinary reads and explicit recovery revision mismatches?"]};
 const bytes=Buffer.from(JSON.stringify(receipt,null,2)+"\n");
 if(process.argv[2]==="--write"){
  const path=join(archive,"FRONTIER-FAILURE-REPLAY.json");
  writeFileSync(path,bytes,{flag:"wx",mode:0o600});
  console.log(JSON.stringify({status:receipt.status,receipt_path:path,receipt_sha256:sha(bytes),first_failure_capture_count:firstFailureAt}));
 }else console.log(JSON.stringify({status:receipt.status,receipt_sha256:sha(bytes),first_failure_capture_count:firstFailureAt}));
}
main().catch(error=>{console.error(JSON.stringify({status:"replay-error",error:String(error.message)}));process.exitCode=2;});
