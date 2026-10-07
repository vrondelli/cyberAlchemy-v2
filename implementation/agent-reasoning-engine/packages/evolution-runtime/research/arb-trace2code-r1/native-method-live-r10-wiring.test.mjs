// Exact successor parity and actual32 source-backed policy/audit checks; no providers/labels.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R10.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {join} from 'node:path';import {createHash} from 'node:crypto';
import {nativeFilePredictionR10} from './native-method-live-policy-r10.mjs';
import {checkSavedExchange,selectEpisodeTerminal,checkCanonicalObservation} from './audit-native-method-live-r10.mjs';
import {loadProfileBoundModule,profileClosureEvidence} from './profile-bound-module-closure-r10.mjs';
import {providerBody} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
const {auditNavigationPresentations}=await loadProfileBoundModule(new URL('./audit-navigation-state-r6b.mjs',import.meta.url));
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8'),sha=b=>createHash('sha256').update(b).digest('hex');
const runnerPairs=[["// Qualified profile-bound native successor of frozen r8; unchanged tasks and gates.","// Qualified common-contract successor of frozen r9; unchanged tasks and gates."],["G01-NATIVE-METHOD-LIVE-R9","G01-NATIVE-METHOD-LIVE-R10"],["g01-native-method-live-r9-","g01-native-method-live-r10-"],["g01-native-method-r9-","g01-native-method-r10-"],["native-method-vps-r9","native-method-vps-r10"],["native-method-episode-r9.mjs","native-method-episode-r10.mjs"],["native-method-live-policy-r9.mjs","native-method-live-policy-r10.mjs"],["nativeFilePredictionR9 as","nativeFilePredictionR10 as"],["g01-native-method-episode-r9-20261007/RESULT.json","g01-native-method-episode-r10-20261007/RESULT.json"],["976c8647ea9034da156442dd788d5ddfe7c05077bc6c161d4dbf9dd1a9a48d6e","ae9dde038d72bf011e24f6c518df90474b6c9911ef7e7ad451735edcbfee95ca"],["join(HERE,'score-native-method-live-r9.py')","join(HERE,'score-native-method-live-r10.py')"],["join(HERE,'native-method-live-r9-wiring.test.mjs')","join(HERE,'native-method-live-r10-wiring.test.mjs'),join(HERE,'native-method-live-r9-wiring.test.mjs')"],["join(HERE,'audit-native-method-live-r9.mjs')","join(HERE,'audit-native-method-live-r10.mjs')"],["join(HERE,'audit-acquisition-guidance-r7.test.mjs')","join(HERE,'audit-acquisition-guidance-r10.test.mjs'),join(HERE,'audit-acquisition-guidance-r7.test.mjs')"],["g01-native-method-episode-r9-20261007/FREEZE.json","g01-native-method-episode-r10-20261007/FREEZE.json"],["7ac7fd4782085650fd4b86516d464e2fb41ddeb0064a40bc0cd105f13bc05f6d","1a1f5400d08cbf46d9450b951eeea7299183d0f52bdeb85aaf82031263b992c9"],["g01-native-method-episode-r9-20261007/POST-REGRESSION.json","g01-native-method-episode-r10-20261007/POST-REGRESSION.json"],["8eed5790499cd650d4da0a6e2634a731ae1902504f56603ffffc1192956aec53","b7592cc01c636138dd2636aec32198a8cb4e4ea7ee1dd915be8657e1135bf40d"],["g01-native-method-live-r8-20261007/FREEZE.json","g01-native-method-live-r9-20261007/FREEZE.json"],["a7fe0022b0f6d8df91009daf1fc4aa604ac4d4472ce568e79b0cbf24b60cee30","f4120d0a132fc7f0ec8ebe1b719e4e4198c10ec133a2a7a60f3ea5a80bc74dda"],["r8-predecessor-freeze-pin","r9-predecessor-freeze-pin"],["unchanged r8 full16 tasks and dispatch","unchanged r9 full16 tasks and dispatch"],[" need(cases.length===16,'full16');"," const auditorQualification='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r10-20261007/AUDITOR-QUALIFICATION.json';\n need(sha(readFileSync(auditorQualification))==='6d6f722898a468f0e4a5a00fa3a8ad4b5b7674d0070e7d824b7d27eb8839b184','common-contract-auditor-qualification-pin');\n for(const[p,pin]of Object.entries(read(auditorQualification).source_pins)){need(sha(readFileSync(p))===pin,'common-contract-auditor-source-pin');pins[p]=pin;}\n pins[auditorQualification]=sha(readFileSync(auditorQualification));\n need(cases.length===16,'full16');"]];
const auditPairs=[["G01-NATIVE-METHOD-LIVE-R9","G01-NATIVE-METHOD-LIVE-R10"],["g01-native-method-live-r9-","g01-native-method-live-r10-"],["g01-native-method-r9-","g01-native-method-r10-"],["profile-bound-module-closure-r9.mjs","profile-bound-module-closure-r10.mjs"],["checkAcquisitionGuidanceRequestR7","checkAcquisitionGuidanceRequestR10"],["audit-acquisition-guidance-r7.mjs","audit-acquisition-guidance-r10.mjs"]];
const scorePairs=[["G01-NATIVE-METHOD-LIVE-R9","G01-NATIVE-METHOD-LIVE-R10"],["g01-native-method-live-r9-","g01-native-method-live-r10-"]];
function transform(source,pairs){for(const[a,b]of pairs){assert.ok(source.includes(a));source=source.replaceAll(a,b);}return source;}
test('r10 runner has exact r9 tasks budgets dispatch transport and declared profile/qualification seams',()=>{
 assert.equal(read('run-native-method-live-r10.mjs'),transform(read('run-native-method-live-r9.mjs'),runnerPairs));
});
test('r10 audit preserves every original request/source/navigation/terminal check through qualified closure',()=>{
 assert.equal(read('audit-native-method-live-r10.mjs'),transform(read('audit-native-method-live-r9.mjs'),auditPairs));
});
test('r10 score is byte-equivalent with full32 matching audit barrier before labels',()=>{
 const expected=transform(read('score-native-method-live-r9.py'),scorePairs);
 assert.equal(read('score-native-method-live-r10.py'),expected);
 assert.ok(expected.indexOf("assert audit['completed'] == 32")<expected.indexOf('labels ='));
});
test('r10 keeps gates budgets finalization task policy and provider profile unchanged',()=>{
 const prior=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R9.json')),next=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R10.json'));
 for(const k of ['development_gate','limits','finalization','parity','dispatch','labels','cost','terminal','capacity','action_budget','audit','navigation','guidance','provider_profile'])assert.deepEqual(next[k],prior[k]);
});
test('actual r10 live policy and auditor reconstruct all32 qualified source/navigation/terminal cells',async()=>{
 const root='/home/vlad_/are-benchmark-archive/g01-native-method-episode-r10-20261007';
 const raw=readFileSync(join(root,'RESULT.json'));
 assert.equal(sha(raw),'ae9dde038d72bf011e24f6c518df90474b6c9911ef7e7ad451735edcbfee95ca');
 const qualified=JSON.parse(raw);assert.equal(qualified.rows.length,32);let navigation=0;
 for(const row of qualified.rows){
  const bytes=readFileSync(join(root,row.case_id+'-'+row.arm,'RESULT.json'));assert.equal(sha(bytes),row.result_sha256);
  const saved=JSON.parse(bytes),episode=saved.result;
  const prediction=nativeFilePredictionR10(episode);assert.equal(prediction.valid,true);
  const selection=selectEpisodeTerminal(episode);assert.deepEqual(selection.final_read_ids,prediction.final_read_ids);
  assert.deepEqual(selection.final_read_ids,episode.selection.final_read_ids);
  const output=episode.events.find(e=>e.tool==='read_file').output.output;
  const canonical=readFileSync(join('/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r6-20261007',row.case_id,'buggy-java-only/corpus',output.path));
  checkCanonicalObservation(output,canonical);
  assert.deepEqual(prediction.ranked_files,[output.path]);
  const audit=await auditNavigationPresentations({caseId:row.case_id,arm:row.arm,episode,measurements:saved.navigation_measurements});
  assert.deepEqual(audit,saved.navigation_audit);navigation+=audit.confirmed_navigation_presentations;
 }
 assert.equal(navigation,32);assert.equal(profileClosureEvidence().loaded_modules.filter(m=>m.modified).length,2);
});
test('actual r10 auditor binds new profile and rejects old digest, preserves confirmed500 and uncertain reply',()=>{
 const input={operation:'generate',request_id:'synthetic-r10-audit',messages:[{role:'user',content:'x'}],tools:[],output_cap:512};
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
