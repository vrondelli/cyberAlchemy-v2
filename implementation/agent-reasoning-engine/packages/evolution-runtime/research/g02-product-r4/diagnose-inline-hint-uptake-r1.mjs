// Read-only sealed public evidence; one new diagnostic output, no provider/gold.
// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-R2-RESULT.json.
import{readFileSync,writeFileSync,existsSync}from'node:fs';import{join,dirname}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';
import{auditInlinePresentation}from'./inline-hint-uptake-r1.mjs';
const root='/home/vlad_/are-benchmark-archive/g02-inline-orientation-native-exposed-r1-20261006',here=dirname(fileURLToPath(import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(readFileSync(p)),need=(v,r)=>{if(!v)throw Error('uptake-runner.'+r);};
need(!existsSync(join(root,'INLINE-UPTAKE-DIAGNOSTIC-R1.json')),'no-overwrite');
const seal=read(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'));need(seal.results.length===12,'full12');
const rows=[];
for(const s of seal.results){const bytes=readFileSync(join(root,s.pair+'-orientation','RESULT.json'));need(sha(bytes)===s.result_sha256,'result-pin');const r=JSON.parse(bytes),d=auditInlinePresentation(r.result);
 const candidates=d.hints.flatMap(h=>h.candidates);
 rows.push({pair:s.pair,result_sha256:s.result_sha256,generated_hint_reads:r.inline_hint_reads??null,...d,
  confirmed_hint_candidates:candidates.length,
  candidates_with_later_exact_suggested_read:candidates.filter(c=>c.exact_suggested_range_read_ids.length).length,
  candidates_with_later_full_definition_read:candidates.filter(c=>c.contains_full_definition_read_ids.length).length,
  candidates_with_later_definition_overlap:candidates.filter(c=>c.overlaps_definition_read_ids.length).length});
}
const keys=['confirmed_source_reads','confirmed_hint_reads','confirmed_hint_candidates','candidates_with_later_exact_suggested_read','candidates_with_later_full_definition_read','candidates_with_later_definition_overlap'];
const totals=Object.fromEntries(keys.map(k=>[k,rows.reduce((n,r)=>n+r[k],0)]));
const out={status:'all12-successful-request-inline-presentation-diagnostic',pre_score_seal_sha256:sha(readFileSync(join(root,'PRE-SCORE-CAMPAIGN-SEAL.json'))),
 source_sha256:Object.fromEntries(['inline-hint-uptake-r1.mjs','diagnose-inline-hint-uptake-r1.mjs'].map(n=>[n,sha(readFileSync(join(here,n)))])),rows,totals,
 new_provider_calls:0,reference_label_reads:0,claim_ceiling:'Descriptive temporal read association only; no semantic or causal uptake claim. No retrospective change to native result.',authority_effect:'none',open_questions_owner:'G02-INLINE-TYPED-DISCOVERY-R2-RESULT.json'};
const bytes=JSON.stringify(out,null,2)+'\n';writeFileSync(join(root,'INLINE-UPTAKE-DIAGNOSTIC-R1.json'),bytes,{flag:'wx',mode:0o600});console.log(JSON.stringify({status:out.status,totals,sha256:sha(bytes)}));
