from pathlib import Path
import json, hashlib, collections, re
out=Path(__file__).resolve().parent
root=Path.cwd()
base=Path('implementation/agent-reasoning-engine/benchmarks')
roots=[base,Path('agent-reasoning-engine/research'),Path('research/agent-reasoning-engine/glm-context-memory-reuse-2026-09-07')]
files=[];excluded=collections.Counter()
for r in roots:
 for p in sorted(r.rglob('*')):
  if not p.is_file():continue
  if out in p.resolve().parents or 'tool-state-audit-v1' in p.parts:continue
  if any(x in p.parts for x in ['node_modules','.git','__pycache__']):excluded['dependency_or_cache_files']+=1;continue
  kind='source-or-other'
  if p.suffix=='.md':kind='fixture-document' if any(x in p.parts for x in ['fixture','fixtures']) else 'research-report-or-plan'
  elif p.suffix in ['.json','.jsonl']:kind='structured-evidence-or-config'
  files.append({'path':str(p),'bytes':p.stat().st_size,'kind':kind,'inspection':'path-and-size inventoried; no claim of individual content audit'})
extra=Path('implementation/agent-reasoning-engine/GLM-FINISH-PLAN.md');files.append({'path':str(extra),'bytes':extra.stat().st_size,'kind':'research-report-or-plan','inspection':'selected content reviewed'})
family_roots=[base/'glm-fitting-v1',base/'real-reasoning-v1',base/'real-reasoning-v1/interaction-learning']
family_roots += sorted((base/'glm-episodes-v1/evidence').glob('*/'))
family_roots += sorted(p for p in (base/'glm-episodes-v1/analysis').iterdir() if p.is_dir() and p.name!='snapshots')
family_roots += sorted(p for p in (base/'glm-episodes-v1/analysis/provider-study-v1').iterdir() if p.is_dir() and p.name not in ['frozen','calibration','container-preflight','live-run','review-1','review-2','review-3','review-4'])
family_roots += [base/'external-context-v1']+sorted(p for p in (base/'external-context-v1').iterdir() if p.is_dir() and p.name.endswith('-v1'))
family_roots += [Path('research/agent-reasoning-engine/glm-context-memory-reuse-2026-09-07'),Path('agent-reasoning-engine/research/feedback-timing-v1')]
families=[]
for p in family_roots:
 if not p.is_dir():continue
 docs=[x for x in sorted(p.glob('*.md'))]
 facts=[]
 for d in docs:
  s=d.read_text()
  facts.append({'path':str(d),'sha256':hashlib.sha256(s.encode()).hexdigest(),'title':s.splitlines()[0] if s else '', 'inspection':'document metadata and report excerpt reviewed; consult source for full protocol'})
 descendants=[f for f in files if f['path'].startswith(str(p)+'/')]
 families.append({'path':str(p),'file_count_including_descendants':len(descendants),'direct_reports':facts,'inspection':'family-level synthesis; nested raw events inventoried, not all individually adjudicated','overlap':'parent/child inventories overlap; never sum as independent trials'})
# Keep exact report revisions and duplicate document bytes visible, without copying their text.
docs=[Path(f['path']) for f in files if f['kind']=='research-report-or-plan']
groups=collections.defaultdict(list);missing=[];tmprefs=[]
for p in docs:
 s=p.read_text(errors='replace');groups[hashlib.sha256(s.encode()).hexdigest()].append(str(p))
 for label,target in re.findall(r'\[([^\]]*)\]\(([^)]+)\)',s):
  if target.startswith(('http:','https:','mailto:','#')):continue
  target=target.split('#')[0]
  if not target:continue
  q=p.parent/target
  if not q.exists():missing.append({'source':str(p),'label':label,'target':target,'inspection':'local target absent; may be historical, illustrative or stale'})
 for match in re.findall(r'/tmp/[A-Za-z0-9_./-]+',s):
  tmprefs.append({'source':str(p),'path':match.rstrip('.'),'exists_now':Path(match.rstrip('.')).exists(),'inspection':'existence only; contents not read'})
data={'schema_version':'are.experiment-recap-inventory/v1','authority_effect':'none','generated_date':'2026-09-10','scope':[str(x) for x in roots]+[str(extra)],'method':'Recursive path/size inventory; selected report content and key structured summaries reviewed. No provider, tokenizer, Docker, credentials, test execution or source mutation. Directory families overlap. Raw traces delegated separately. Report statements are attributed historical evidence, not newly reproduced experiments.','counts':{'files':len(files),'families':len(families),'report_documents':len(docs),'missing_local_links':len(missing),**dict(excluded)},'families':families,'files':files,'identical_document_groups':[{'sha256':k,'paths':v} for k,v in groups.items() if len(v)>1],'missing_local_links':missing,'historical_tmp_references':tmprefs,'open_questions':['Which absent raw historical runs can be recovered without exposing credentials or private reasoning?','Which nested copied exports share run identity and must be excluded from global totals?','Which source-body preservation benefit transfers to typed working state at fixed total input plus output token budgets?']}
(out/'inventory.json').write_text(json.dumps(data,indent=2)+'\n')
print(json.dumps(data['counts']))
