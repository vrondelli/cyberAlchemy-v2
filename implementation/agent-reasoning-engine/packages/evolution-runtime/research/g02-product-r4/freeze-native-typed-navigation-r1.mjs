// New exposed development campaign; no provider or reference-label reads.
// Open Questions: evidence/G02-TYPED-NAVIGATION-R2.json.
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
const here=dirname(fileURLToPath(import.meta.url)),root='/home/vlad_/are-benchmark-archive/g02-typed-navigation-native-exposed-r1-20261006';
const prior='/home/vlad_/are-benchmark-archive/g02-native-workspace-matched-exposed-r1-20261006',construction='/home/vlad_/are-benchmark-archive/g02-typed-navigation-construction-r2-20261006';
const bytes=p=>readFileSync(p),sha=b=>createHash('sha256').update(b).digest('hex');
if(existsSync(root))throw Error('navigation-freeze.no-overwrite');
const oldBytes=bytes(join(prior,'FREEZE.json')),old=JSON.parse(oldBytes),sealBytes=bytes(join(construction,'CONSTRUCTION-SEAL.json')),seal=JSON.parse(sealBytes);
if(old.cases.length!==12||seal.rows.length!==24||seal.new_provider_calls!==0||seal.reference_label_reads!==0||seal.status_counts['navigation.parser-failed'])throw Error('navigation-freeze.capacity');
for(const [n,pin]of Object.entries(seal.source_sha256))if(sha(bytes(join(here,n)))!==pin)throw Error('navigation-freeze.construction-drift');
const names=['run-native-typed-navigation-arm-r1.mjs','typed-navigation-r2.mjs','typed-source-structure-r2.py','wsl-vps-provider-r1.mjs','wsl-vps-provider-multiplexed-r2.mjs','vps-json-provider-r1.mjs','freeze-native-typed-navigation-r1.mjs'];
const source_sha256=Object.fromEntries(names.map(n=>[n,sha(bytes(join(here,n)))]));
const protocol=bytes(join(here,'../../evidence/G02-TYPED-NAVIGATION-R2.json'));
mkdirSync(root,{mode:0o700});
writeFileSync(join(root,'FREEZE.json'),JSON.stringify({schema_version:'are.g02-native-typed-navigation-development/v1',status:'frozen-before-provider',cases:old.cases,
 episode_sha256:old.episode_sha256,source_sha256,construction_sha256:sha(sealBytes),prior_campaign_sha256:sha(oldBytes),protocol_sha256:sha(protocol),
 budget:{maximum_model_calls_per_case:20,maximum_total_tokens_per_case:650000,maximum_output_tokens:8192,maximum_campaign_generation_calls:240,automatic_retries:0},
 comparators:'Archived native control and historical DSH, development diagnostics only; not contemporaneous confirmation.',
 advancement_gate:JSON.parse(protocol).prospective_native_contract.development_advancement_gate,
 label_barrier:'All12 new native arms terminal and output identities sealed before scoring; no provider uncertainty replay.',
 claim_ceiling:'Exposed development only; no superiority.',authority_effect:'none',open_questions_owner:'G02-TYPED-NAVIGATION-R2.json'},null,2)+'\n',{flag:'wx',mode:0o600});
writeFileSync(join(root,'PROTOCOL.json'),protocol,{flag:'wx',mode:0o600});
console.log(JSON.stringify({root,freeze_sha256:sha(bytes(join(root,'FREEZE.json'))),construction_sha256:sha(sealBytes)}));
