"""Post-run verification and accounting. Preserve the frozen literal rubric."""
import hashlib,json,statistics
from pathlib import Path
BASE=Path(__file__).resolve().parent;ROOT=BASE.parents[7]
load=lambda p:json.loads(p.read_text())
r=load(BASE/'RESULT-v2.json');m=load(BASE/'MANIFEST-v2.json');rubric=load(BASE.parent/'rubric.json')
material={k:v for k,v in m.items() if k!='manifest_digest'}
assert hashlib.sha256(json.dumps(material,sort_keys=True,separators=(',',':')).encode()).hexdigest()==m['manifest_digest']
for e in m['files']:assert hashlib.sha256((ROOT/e['path']).read_bytes()).hexdigest()==e['sha256'],e['path']
assert len(r['records'])==r['model_calls']==48 and len({x['thread_id'] for x in r['records']})==48
assert all(x['status']=='completed' for x in r['records'])
failures=[]
for x in r['records']:
 a=x['answer'];o=rubric[x['checkpoint']];valid=True
 for c in a['citations']:
  lines=(ROOT/c['path']).read_text().splitlines();actual=lines[c['line']-1]
  good=c['path'] in o['sources'] and bool(c['quote'].strip()) and c['quote'] in actual;valid=valid and good
  if not good:
   stripped=c['quote'].strip();matches=[i+1 for i,line in enumerate(lines) if stripped in line.strip()]
   kind='indentation' if c['line'] in matches else 'line-number-and-indentation' if matches else 'quote-escaping-or-content'
   failures.append({'checkpoint':x['checkpoint'],'arm':x['arm'],'pass':x['pass'],'path':c['path'],'line':c['line'],'kind':kind,'normalized_matching_lines':matches})
 verdict=a['verdict']==o['verdict'];valid=valid and bool(a['citations'])
 assert verdict==x['score']['verdict_ok'] and valid==x['score']['citations_ok']
summary={}
for arm in ['summary','are']:
 rows=[x for x in r['records'] if x['arm']==arm];draft={x['checkpoint']:x for x in rows if x['pass']=='draft'};review=[x for x in rows if x['pass']=='review']
 tokens={k:sum(x['usage'].get(k,0) for x in rows) for k in ['inputTokens','cachedInputTokens','outputTokens','reasoningOutputTokens']}
 summary[arm]={'draft_verdicts_correct':sum(x['score']['verdict_ok'] for x in draft.values()),'review_verdicts_correct':sum(x['score']['verdict_ok'] for x in review),'draft_strict_passes':sum(x['score']['passed'] for x in draft.values()),'review_strict_passes':sum(x['score']['passed'] for x in review),'strict_repairs':sum(x['score']['passed'] and not draft[x['checkpoint']]['score']['passed'] for x in review),'strict_regressions':sum(not x['score']['passed'] and draft[x['checkpoint']]['score']['passed'] for x in review),'tokens':tokens,'standard_token_rate_credits':((tokens['inputTokens']-tokens['cachedInputTokens'])*5+tokens['cachedInputTokens']*.5+tokens['outputTokens']*30)/1e6,'conservative_credits':sum(x['conservative_usage_credits'] for x in rows),'model_latency_total_ms':sum(x['latency_ms'] for x in rows),'model_latency_median_ms':statistics.median(x['latency_ms'] for x in rows)}
assert sum(v['conservative_credits'] for v in summary.values())<50
assessment={'status':'COMPLETE-BOUNDED-AUDIT','model':r['model'],'model_turns':48,'fresh_threads':48,'elapsed_ms':r['elapsed_ms'],'source_integrity':'PASS','independent_score_recomputation':'PASS','arms':summary,'strict_citation_errors':failures,'parent_semantic_review':{'reviewed_findings':24,'verdicts_and_core_explanations':'consistent with supplied source evidence','citation_defects':'retained as failures; model output not repaired','new_runtime_defects_established':0},'billing':{'initial':r['initial_credit_snapshot'],'last':r['records'][-1]['credit_snapshot_after'],'observed_purchased_credit_drop':r['initial_credit_snapshot']['balance']-r['records'][-1]['credit_snapshot_after']['balance'],'api_credit_used':0,'claim_limit':'Balance and allowance are account-wide snapshots; rate-based estimates are not a billing receipt.'},'limits':['One staged task, no independent replications or causal superiority claim.','Core verdicts tie; literal citation errors dominate the strict-score difference.','Context preparation timing includes thread startup and account reads, so isolated ARE overhead is not_evaluable.','No human maintenance usability measurement or unrestricted coding-task assessment.','Codex backend retries are not independently observed; 48 is model turns, not verified backend request count.'],'authority_effect':'none'}
(BASE/'ASSESSMENT.json').write_text(json.dumps(assessment,indent=2)+'\n');print(json.dumps(summary,indent=2));print('PASS: source closure, 48 isolated completed turns, independent scoring and budget accounting')
