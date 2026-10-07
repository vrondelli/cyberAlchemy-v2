// Prospective exact wiring parity and synthetic exchange checks; no labels/providers.
// Open Questions: evidence/G01-NATIVE-METHOD-LIVE-R8.json.
import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {checkSavedExchange} from './audit-native-method-live-r8.mjs';
import {providerBody} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';
import {hash} from '../g02-product-r4/vps-json-provider-r1.mjs';
const read=n=>readFileSync(new URL(n,import.meta.url),'utf8');
const provenance=" const predecessor='/home/vlad_/are-benchmark-archive/g01-native-method-live-r7-20261007/FREEZE.json';\n need(sha(readFileSync(predecessor))==='5bcff6edf117d236ec50b208484ee47e84631b9a9439fc12b291c48c2f0e8dff','predecessor-freeze-pin');\n const predecessorFreeze=read(predecessor);\n for(const[p,pin]of Object.entries(predecessorFreeze.source_pins)){need(sha(readFileSync(p))===pin,'predecessor-source-pin');pins[p]=pin;}\n const qualificationPins={\n  '/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-profile-r1-20261007/FREEZE.json':'53ef65c7ba4a67b5a95a54c21f06696c93b8781fa34e1fde9b377636c1052532',\n  '/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-profile-r1-20261007/RESULT.json':'da513fb5b1f59dbba79a422a063bebc7916a05aaa2e8ee7001d250eb28828e82',\n  '/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-binding-r1-20261007/FREEZE.json':'baa96bf5fc82dca150cbcaf0e5a3bc9048261a31be1d7ea5de998d943a55fd6e',\n  '/home/vlad_/are-benchmark-archive/g01-public-stateless-provider-binding-r1-20261007/RESULT.json':'ab81e09250c63fd004ec90d2349fcbb59bfe30991cc17e486983066aceac1031'};\n for(const[p,pin]of Object.entries(qualificationPins)){need(sha(readFileSync(p))===pin,'shared-profile-qualification-pin');pins[p]=pin;}\n pins[predecessor]=sha(readFileSync(predecessor));\n";
test('r8 runner preserves exact r7 engine/requests/budgets with declared shared profile and lineage closure',()=>{
 const expected=read('run-native-method-live-r7.mjs')
 .replaceAll('G01-NATIVE-METHOD-LIVE-R7','G01-NATIVE-METHOD-LIVE-R8').replaceAll('g01-native-method-live-r7-','g01-native-method-live-r8-')
 .replaceAll('g01-native-method-r7-','g01-native-method-r8-').replace('native-method-vps-r7','native-method-vps-r8')
 .replace('// Separately versioned evidence-guided native successor of frozen r6; no gate/transport widening.','// Shared-profile successor of frozen r7; unchanged native adapter and gates.')
 .replace("import {providerBody} from '../g02-product-r4/wsl-vps-provider-r1.mjs';\nimport {createMultiplexedVpsProvider,validatePrivateControlSocket} from '../g02-product-r4/wsl-vps-provider-multiplexed-r2.mjs';",
 "import {providerBody,createPublicStatelessVpsProvider,validatePrivateControlSocket} from '../g02-product-r4/public-stateless-provider-binding-r1.mjs';")
 .replace('post=createMultiplexedVpsProvider({controlSocket:socket});','post=await createPublicStatelessVpsProvider({controlSocket:socket});')
 .replace("join(HERE,'score-native-method-live-r7.py')","join(HERE,'score-native-method-live-r8.py')")
 .replace("join(HERE,'native-method-live-r7-wiring.test.mjs')","join(HERE,'native-method-live-r8-wiring.test.mjs'),join(HERE,'../g02-product-r4/public-stateless-provider-binding-r1.test.mjs'),join(HERE,'../g02-product-r4/public-stateless-provider-profile-r1.test.mjs'),join(HERE,'../g02-product-r4/wsl-vps-provider-multiplexed-r2.test.mjs'),join(HERE,'../g02-product-r4/vps-json-provider-r1.test.mjs')")
 .replaceAll("join(HERE,'audit-native-method-live-r7.mjs')","join(HERE,'audit-native-method-live-r8.mjs')")
 .replace(' const screen=new Map',provenance+' const screen=new Map')
 .replace(" need(cases.length===16,'full16');"," assert.deepEqual(cases,predecessorFreeze.cases,'unchanged full16 tasks and dispatch');\n need(cases.length===16,'full16');");
 assert.equal(read('run-native-method-live-r8.mjs'),expected);
});
test('r8 audit preserves all request/source/policy checks, changing only campaign identity and body validator',()=>{
 const expected=read('audit-native-method-live-r7.mjs')
 .replaceAll('G01-NATIVE-METHOD-LIVE-R7','G01-NATIVE-METHOD-LIVE-R8').replaceAll('g01-native-method-live-r7-','g01-native-method-live-r8-')
 .replaceAll('g01-native-method-r7-','g01-native-method-r8-')
 .replace("from '../g02-product-r4/wsl-vps-provider-r1.mjs'","from '../g02-product-r4/public-stateless-provider-binding-r1.mjs'");
 assert.equal(read('audit-native-method-live-r8.mjs'),expected);
});
test('r8 score formulas and full32 matching-audit-before-label barrier are byte-equivalent to r7',()=>{
 const expected=read('score-native-method-live-r7.py').replaceAll('G01-NATIVE-METHOD-LIVE-R7','G01-NATIVE-METHOD-LIVE-R8').replaceAll('g01-native-method-live-r7-','g01-native-method-live-r8-');
 assert.equal(read('score-native-method-live-r8.py'),expected);
 assert.ok(expected.indexOf("assert audit['completed'] == 32")<expected.indexOf('labels ='));
});
test('original gates, budgets, source contracts, task policy and native adapter qualification retained',()=>{
 const old=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R7.json')),next=JSON.parse(read('../../evidence/G01-NATIVE-METHOD-LIVE-R8.json'));
 for(const key of ['development_gate','limits','finalization','qualified_adapter','parity','dispatch','labels','cost','terminal','capacity','action_budget','audit','navigation','guidance'])assert.deepEqual(next[key],old[key]);
 assert.equal(next.provider_profile.shared_across_arms,true);assert.equal(next.provider_profile.output_cap,512);
});
test('actual r8 auditor binds synthetic shared-profile generation and rejects original-profile digest',()=>{
 const input={operation:'generate',request_id:'synthetic-r8-audit',messages:[{role:'user',content:'x'}],tools:[],output_cap:512};
 const sha=hash(providerBody(input)),start={input,request_sha256:sha};
 const reply={schema_version:'are.private-vps-provider-reply/v1',request_id:input.request_id,operation:'generate',request_sha256:sha,
 dispatched:true,status:200,prompt_tokens:100,completion_tokens:20,automatic_retries:0,redirects_followed:0};
 const receipt={kind:'model',request_sha256:sha,dispatched:true,dispatch_uncertain:false,status:200,input_tokens:100,output_tokens:20,failure_code:null,output_cap:512,automatic_retries:0};
 assert.equal(checkSavedExchange(start,reply,receipt),120);
 const oldBody=JSON.parse(providerBody(input));oldBody.thinking.clear_thinking=false;
 assert.throws(()=>checkSavedExchange(start,{...reply,request_sha256:hash(oldBody)},receipt));
});
test('actual r8 auditor preserves bound tokenizer500 and unknown dispatch metadata without invented generation cost',()=>{
 const input={operation:'tokenize',request_id:'synthetic-r8-tokenizer',messages:[{role:'user',content:'x'}],tools:[],output_cap:512};
 const sha=hash(providerBody(input)),start={input,request_sha256:sha};
 const reply={schema_version:'are.private-vps-provider-reply/v1',request_id:input.request_id,operation:'tokenize',request_sha256:sha,
 dispatched:true,status:500,prompt_tokens:null,completion_tokens:null,automatic_retries:0,redirects_followed:0};
 const receipt={kind:'tokenizer',request_sha256:sha,dispatched:true,dispatch_uncertain:false,status:500,input_tokens:null,output_tokens:0,failure_code:null,output_cap:512,automatic_retries:0};
 assert.equal(checkSavedExchange(start,reply,receipt),0);
 assert.equal(checkSavedExchange(start,{...reply,dispatch_uncertain:true,dispatched:null,status:null,failure_code:'ssh-no-bound-reply'},
 {...receipt,dispatched:false,dispatch_uncertain:true,status:null,failure_code:'ssh-no-bound-reply'}),0);
});
