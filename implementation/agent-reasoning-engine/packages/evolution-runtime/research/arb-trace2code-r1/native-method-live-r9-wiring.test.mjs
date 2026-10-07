// Exact successor parity and actual32 source-backed policy/audit checks; no providers/labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R9.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {nativeFilePredictionR9} from './native-method-live-policy-r9.mjs';
import {checkSavedExchange,selectEpisodeTerminal,checkCanonicalObservation} from './audit-native-method-live-r9.mjs';
import {loadProfileBoundModule,profileClosureEvidence} from './profile-bound-module-closure-r9.mjs';
import {providerBody} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
const {auditNavigationPresentations}=await loadProfileBoundModule(new URL('./audit-navigation-state-r6b.mjs',import.meta.url));
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),sha=b=>createHash('sha256').update(b).digest('hex');
const runnerPairs=[["// Shared-profile successor of frozen r7; unchanged native adapter and gates.","// Qualified profile-bound native successor of frozen r8; unchanged tasks and gates."],["G01-NATIVE-METHOD-LIVE-R8","G01-NATIVE-METHOD-LIVE-R9"],["g01-native-method-live-r8-","g01-native-method-live-r9-"],["g01-native-method-r8-","g01-native-method-r9-"],["native-method-vps-r8","native-method-vps-r9"],["loadEvidenceGuidedMethodEpisode","loadProfileBoundMethodEpisode"],["runEvidenceGuidedMethodEpisode","runProfileBoundMethodEpisode"],["from './native-method-episode-r7.mjs'","from './native-method-episode-r9.mjs'"],["from './native-method-live-policy-r7.mjs'","from './native-method-live-policy-r9.mjs'"],["nativeFilePredictionR7 as","nativeFilePredictionR9 as"],["import {stable,bodyForReceipt}","import {stable}"],["g01-native-method-episode-r7-20261007/RESULT.json","g01-native-method-episode-r9-20261007/RESULT.json"],["89ef884e7f3f2ef5daebcbe69757667f80e84cf216f1faa87d5d7f669e2f0490","976c8647ea9034da156442dd788d5ddfe7c05077bc6c161d4dbf9dd1a9a48d6e"],["join(HERE,'score-native-method-live-r8.py')","join(HERE,'score-native-method-live-r9.py')"],["join(HERE,'native-method-live-r8-wiring.test.mjs')","join(HERE,'native-method-live-r9-wiring.test.mjs'),join(HERE,'native-method-live-r8-wiring.test.mjs')"],["join(HERE,'audit-native-method-live-r8.mjs')","join(HERE,'audit-native-method-live-r9.mjs')"],[" need(cases.length===16,'full16');"," const profileQualification='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r9-20261007/FREEZE.json';\n need(sha(readFileSync(profileQualification))==='7ac7fd4782085650fd4b86516d464e2fb41ddeb0064a40bc0cd105f13bc05f6d','profile-closure-qualification-pin');\n const qualifiedFreeze=read(profileQualification);\n for(const[p,pin]of Object.entries(qualifiedFreeze.source_pins)){need(sha(readFileSync(p))===pin,'profile-closure-qualified-source-pin');pins[p]=pin;}\n pins[profileQualification]=sha(readFileSync(profileQualification));\n const regressions='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r9-20261007/POST-REGRESSION.json';\n need(sha(readFileSync(regressions))==='8eed5790499cd650d4da0a6e2634a731ae1902504f56603ffffc1192956aec53','profile-closure-regressions-pin');pins[regressions]=sha(readFileSync(regressions));\n const priorCampaign='/home/vlad_/are-benchmark-archive/g01-native-method-live-r8-20261007/FREEZE.json';\n need(sha(readFileSync(priorCampaign))==='a7fe0022b0f6d8df91009daf1fc4aa604ac4d4472ce568e79b0cbf24b60cee30','r8-predecessor-freeze-pin');pins[priorCampaign]=sha(readFileSync(priorCampaign));\n assert.deepEqual(cases,read(priorCampaign).cases,'unchanged r8 full16 tasks and dispatch');\n need(cases.length===16,'full16');"]];
const auditPairs=[["G01-NATIVE-METHOD-LIVE-R8","G01-NATIVE-METHOD-LIVE-R9"],["g01-native-method-live-r8-","g01-native-method-live-r9-"],["g01-native-method-r8-","g01-native-method-r9-"],["import {stable,bindDelivery} from '../../../../benchmarks/contextbench-v1/delivery.mjs';","import {loadProfileBoundModule} from './profile-bound-module-closure-r9.mjs';\nconst {stable,bindDelivery}=await loadProfileBoundModule(new URL('../../../../benchmarks/contextbench-v1/delivery.mjs',import.meta.url));"],["import {selectMethodHandleSubmission} from './method-selection-terminal-r5.mjs';","const {selectMethodHandleSubmission}=await loadProfileBoundModule(new URL('./method-selection-terminal-r5.mjs',import.meta.url));"],["import {auditNavigationPresentations,navigationMeasurement} from './audit-navigation-state-r6b.mjs';","const {auditNavigationPresentations,navigationMeasurement}=await loadProfileBoundModule(new URL('./audit-navigation-state-r6b.mjs',import.meta.url));"]];
const scorePairs=[["G01-NATIVE-METHOD-LIVE-R8","G01-NATIVE-METHOD-LIVE-R9"],["g01-native-method-live-r8-","g01-native-method-live-r9-"]];
function transform(source,pairs){for(const[a,b]of pairs){assert.ok(source.includes(a));source=source.replaceAll(a,b);}return source;}
test('r9 runner has exact r8 tasks budgets dispatch transport and declared profile/qualification seams',()=>{
 assert.equal(read('run-native-method-live-r9.mjs'),transform(read('run-native-method-live-r8.mjs'),runnerPairs));
});
test('r9 audit preserves every original request/source/navigation/terminal check through qualified closure',()=>{
 assert.equal(read('audit-native-method-live-r9.mjs'),transform(read('audit-native-method-live-r8.mjs'),auditPairs));
});
test('r9 score is byte-equivalent with full32 matching audit barrier before labels',()=>{
 const expected=transform(read('score-native-method-live-r8.py'),scorePairs);
 assert.equal(read('score-native-method-live-r9.py'),expected);
 assert.ok(expected.indexOf("assert audit['completed'] == 32")<expected.indexOf('labels ='));
});
test('r9 keeps gates budgets finalization task policy and provider profile unchanged',()=>{
 const prior=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R8.json')),next=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R9.json'));
 for(const k of ['development_gate','limits','finalization','parity','dispatch','labels','cost','terminal','capacity','action_budget','audit','navigation','guidance','provider_profile'])assert.deepEqual(next[k],prior[k]);
});
test('actual r9 live policy and auditor reconstruct all32 qualified source/navigation/terminal cells',async()=>{
 const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r9-20261007';
 const raw=readFileSync(join(root,'RESULT.json'));
 assert.equal(sha(raw),'976c8647ea9034da156442dd788d5ddfe7c05077bc6c161d4dbf9dd1a9a48d6e');
 const qualified=JSON.parse(raw);assert.equal(qualified.rows.length,32);let navigation=0;
 for(const row of qualified.rows){
  const bytes=readFileSync(join(root,row.case_id+'-'+row.arm,'RESULT.json'));assert.equal(sha(bytes),row.result_sha256);
  const saved=JSON.parse(bytes),episode=saved.result;
  const prediction=nativeFilePredictionR9(episode);assert.equal(prediction.valid,true);
  const selection=selectEpisodeTerminal(episode);assert.deepEqual(selection.final_read_ids,prediction.final_read_ids);
  assert.deepEqual(selection.final_read_ids,episode.selection.final_read_ids);
  const output=episode.events.find(e=>e.tool==='read_file').output.output;
  const canonical=readFileSync(join('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007',row.case_id,'buggy-java-only/corpus',output.path));
  checkCanonicalObservation(output,canonical);
  assert.deepEqual(prediction.ranked_files,[output.path]);
  const audit=await auditNavigationPresentations({caseId:row.case_id,arm:row.arm,episode,measurements:saved.navigation_measurements});
  assert.deepEqual(audit,saved.navigation_audit);navigation+=audit.confirmed_navigation_presentations;
 }
 assert.equal(navigation,32);assert.equal(profileClosureEvidence().loaded_modules.filter(m=>m.modified).length,1);
});
test('actual r9 auditor binds new profile and rejects old digest, preserves confirmed500 and uncertain reply',()=>{
 const input={operation:'generate',request_id:'synthetic-r9-audit',messages:[{role:'user',content:'x'}],tools:[],output_cap:512};
 const hash=sha(providerBody(input)),start={input,request_sha256:hash};
 const reply={schema_version:'are.private-vps-provider-reply/v1',request_id:input.request_id,operation:'generate',request_sha256:hash,
 dispatched:true,status:200,prompt_tokens:100,completion_tokens:20,automatic_retries:0,redirects_followed:0};
 const receipt={kind:'model',request_sha256:hash,dispatched:true,dispatch_uncertain:false,status:200,input_tokens:100,output_tokens:20,failure_code:null,output_cap:512,automatic_retries:0};
 assert.equal(checkSavedExchange(start,reply,receipt),120);
 const old=JSON.parse(providerBody(input));old.thinking.clear_thinking=false;
 assert.throws(()=>checkSavedExchange(start,{...reply,request_sha256:sha(JSON.stringify(old))},receipt));
 const token={...input,operation:'tokenize'},tokenHash=sha(providerBody(token));
 const tokenStart={input:token,request_sha256:tokenHash};
 const tokenReply={...reply,operation:'tokenize',request_sha256:tokenHash,status:500,prompt_tokens:null,completion_tokens:null};
 const tokenReceipt={...receipt,kind:'tokenizer',request_sha256:tokenHash,status:500,input_tokens:null,output_tokens:0};
 assert.equal(checkSavedExchange(tokenStart,tokenReply,tokenReceipt),0);
 assert.equal(checkSavedExchange(tokenStart,{...tokenReply,dispatch_uncertain:true,dispatched:null,status:null,failure_code:'ssh-no-bound-reply'},
 {...tokenReceipt,dispatched:false,dispatch_uncertain:true,status:null,failure_code:'ssh-no-bound-reply'}),0);
});
