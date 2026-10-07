// Source-only exposed generation. Open Questions: G01-CANONICAL-ENTITY-OPERATOR-DEV-R1.md.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyProjection} from './materialize-canonical-exposed-r1.mjs';
import {navigationRanking} from './source-entity-operator-nav-r1.mjs';
import {createRankedSourceAcquisition} from './ranked-source-acquisition-java-canonical-r1.mjs';
import {productionPath} from './screen-defects4j-production-candidates-r1.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const root='/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1';
const ab=readFileSync(join(root,'ARE-SCREEN.json')),rb=readFileSync(join(root,'REPOMAP-SCREEN.json'));
if(sha(ab)!=='7e8f0c59fff072d2ef2c275577243f56cd27e8fb82abcafb47f5234bcedf8b7c'||sha(rb)!=='8bde2a797643a950af6a320f99041970d99480c475f0a9057bd66ecbf26ab646')throw Error('source seal drift');
const protocol=readFileSync(new URL('../../evidence/G01-CANONICAL-ENTITY-OPERATOR-DEV-R1.md',import.meta.url));
const a=JSON.parse(ab),r=new Map(JSON.parse(rb).cases.map(c=>[c.case_id,c]));
if(a.cases.length!==62||r.size!==62)throw Error('denominator');
const cases=[];const started=Date.now();
for(const c of a.cases){
  const proof=verifyProjection(c.projection_root);if(proof.projection_receipt_sha256!==c.projection_receipt_sha256)throw Error('source drift');
  const receipt=JSON.parse(readFileSync(join(c.projection_root,'RECEIPT.json'))),corpus=join(c.projection_root,'corpus');
  const docs=receipt.sources.map(s=>({path:s.path,text:[...readFileSync(join(corpus,s.path),'utf8')].slice(0,20000).join(''),source_sha256:s.sha256}));
  const repomap=r.get(c.case_id);if(repomap.source_tree_sha256!==c.source_tree_sha256||repomap.expanded_query_sha256!==c.expanded_query_sha256)throw Error('comparator drift');
  const original=[...new Set([...c.are_production.slice(0,10),...repomap.repomap_original.slice(0,10),...c.stack.slice(0,8)])].sort();
  const callerAdded=c.are_caller.slice(0,10).filter(p=>!original.includes(p)).slice(0,4);
  const base=[...new Set([...original,...callerAdded])].sort();
  const engine=createRankedSourceAcquisition({root:corpus,source_manifest:join(c.projection_root,'RECEIPT.json'),base_commit:receipt.buggy_commit,problem_statement:c.query,maximum_index_bytes:256*1024*1024,mode:'trace-text'});
  const q=engine.rankAll(c.expanded_query);if(q.partial_index||q.indexed_files!==c.source_count)throw Error('partial control');
  const order=q.ranked_files.filter(productionPath);const framePaths=[...new Set(c.frames.flatMap(f=>f.matches.map(m=>m.path)))];
  const variants={};
  for(const variant of ['combined','entity','operator']){
    const nav=navigationRanking(docs,c.query,framePaths,c.are_caller,productionPath,order,variant);
    const added=nav.ranked.filter(p=>!base.includes(p)).slice(0,4);
    const control=order.filter(p=>!base.includes(p)).slice(0,added.length);if(control.length!==added.length)throw Error('width mismatch');
    variants[variant]={added,candidates:[...new Set([...base,...added])].sort(),control_added:control,control_candidates:[...new Set([...base,...control])].sort(),seeds:nav.seeds,signals:nav.signals,graph_edges:nav.graph_edges,added_witnesses:Object.fromEntries(added.map(p=>[p,nav.witnesses.get(p)])),ranked_top20:nav.ranked.slice(0,20)};
  }
  cases.push({case_id:c.case_id,cohort:c.cohort,project:c.project,bug:c.bug,source_tree_sha256:c.source_tree_sha256,base_candidates:base,variants});
  console.log(JSON.stringify({case_id:c.case_id,finished:cases.length,added:variants.combined.added.length,operator_seeds:variants.combined.signals.operator.length,qualified_seeds:variants.combined.signals.qualified.length}));
}
const result={schema:'are.canonical-entity-operator-source-screen/v1',posture:'all62 exposed source-only generation; no gold reads or providers by generator; policy selected using exposed diagnostics',cases,are_sha256:sha(ab),repomap_sha256:sha(rb),protocol_sha256:sha(protocol),implementation_sha256:sha(readFileSync(fileURLToPath(import.meta.url))),navigator_sha256:sha(readFileSync(new URL('./source-entity-operator-nav-r1.mjs',import.meta.url))),elapsed_s:(Date.now()-started)/1000,open_questions_owner:'G01-CANONICAL-ENTITY-OPERATOR-DEV-R1.md'};
const bytes=JSON.stringify(result,null,2)+'\n';writeFileSync(join(root,'ENTITY-OPERATOR-SCREEN-R1.json'),bytes,{flag:'wx',mode:0o600});console.log(JSON.stringify({terminal:true,cases:cases.length,sha256:sha(bytes)}));
