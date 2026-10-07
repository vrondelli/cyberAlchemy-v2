// Exact, hash-pinned overlays for the VPS benchmark snapshot.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const [episodeInput,orchestratorInput,helperInput,episodeOutput,orchestratorOutput]=process.argv.slice(2);
if([episodeInput,orchestratorInput,helperInput,episodeOutput,orchestratorOutput].some(value=>!value))throw Error('packet-overlay.arguments');
const sha=value=>createHash('sha256').update(value).digest('hex');
let helper=readFileSync(helperInput,'utf8');
if(sha(helper)!=='0e3b25e343a5e88712933e4dd0ac0179beefcbf290c9c1c5b38aaf8181a1f126')throw Error('packet-overlay.helper-drift');
helper=helper.replace("import {createHash} from 'node:crypto';\n",'').replace("import {attachObservationHandles,stable} from './delivery.mjs';\n",'').replaceAll('export function ','function ').replaceAll('export async function ','async function ');
function patch(input,expected,replacements,output){
  let source=readFileSync(input,'utf8');
  if(sha(source)!==expected)throw Error('packet-overlay.input-drift:'+input);
  for(const [before,after] of replacements){
    if(source.split(before).length!==2)throw Error('packet-overlay.anchor-count:'+before.slice(0,60));
    source=source.replace(before,after);
  }
  writeFileSync(output,source,{flag:'wx',mode:0o644});
  return sha(source);
}
const episode=patch(episodeInput,'edf8d1477aab9ba86e788a3b22c579cb100d9b8d74197a25fb144f2581882eff',[
  ["const commonLimits=limits=>Object.fromEntries(Object.entries(limits).filter(([key])=>!['task_state_projection','task_state_novelty_gate','terminal_effect_state'].includes(key)));",
   "const commonLimits=limits=>Object.fromEntries(Object.entries(limits).filter(([key])=>!['task_state_projection','task_state_novelty_gate','terminal_effect_state'].includes(key)));\n"+helper],
  ["before_model_dispatch=async()=>true, system_appendix=''}) {",
   "before_model_dispatch=async()=>true, system_appendix='', initial_source_hints=null, initial_focused_source_hints=null}) {"],
  ["pausedBoundary=null,currentIndexForResume=clone(prior?.resume_index??null),activeStep=prior?.next_step??0;",
   `pausedBoundary=null,currentIndexForResume=clone(prior?.resume_index??null),activeStep=prior?.next_step??0;
  if(initial_source_hints!==null){
    if(continuation||!source_context||!Array.isArray(initial_source_hints))throw Error('episode.invalid-initial-source-packet');
    const packet=await prepareInitialSourcePacket({hints:initial_source_hints,focused_hints:initial_focused_source_hints??[],execute_tool});
    pendingToolExchange=packet.exchange;
    await on_event({kind:'initial-source-packet',receipt:packet.receipt,source_bytes:packet.source_bytes,
      selection_rule:packet.selection_rule,delivery_posture:'pending-model-receipt'});
  }`]
],episodeOutput);
const orchestrator=patch(orchestratorInput,'cd6d3f6057324ffbb4ea718105bd24de8b16eb2bef4ea31e159e86e105a9cf10',[
  ["system_appendix:ranked?ranked.summary:''});",
   "system_appendix:ranked?ranked.summary:'',initial_source_hints:ranked?ranked.primer.hints:null,initial_focused_source_hints:ranked?ranked.focused_source_hints:null});"]
],orchestratorOutput);
console.log(JSON.stringify({episode_sha256:episode,orchestrator_sha256:orchestrator}));
