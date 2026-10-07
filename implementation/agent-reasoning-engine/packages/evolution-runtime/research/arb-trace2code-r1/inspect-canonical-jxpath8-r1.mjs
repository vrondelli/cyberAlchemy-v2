// Exposed fixture-fidelity inspection; no evaluation labels or model calls.
// Open Questions: ../../evidence/G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {frameReferences,inspectFrame} from './audit-defects4j-trace-source-r1.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
const base='/home/vlad_/are-benchmark-archive';
const stage=join(base,'defects4j-canonical-jxpath8-r1');
const exported=join(stage,'buggy-java-only');
const bytes=readFileSync(join(exported,'RECEIPT.json'));const projection=JSON.parse(bytes);
if(projection.complete!==true||projection.project!=='JxPath'||projection.bug!==8)throw Error('wrong projection');
if(sha(JSON.stringify(projection.sources))!==projection.source_tree_sha256)throw Error('inventory drift');
for(const source of projection.sources){
  if(sha(readFileSync(join(exported,'corpus',source.path)))!==source.sha256)throw Error('projection drift');
}
const packets=readFileSync(join(base,'defects4j-caller-r4','PACKETS.jsonl'));
if(sha(packets)!=='9cf325c8e3cf2c805214e8f48572e20432860d4ab65f17576ecb7cae91ca99dd')throw Error('packet seal drift');
const p=packets.toString().trimEnd().split('\n').map(JSON.parse).find(p=>p.case_id==='Defects4J-JxPath-8');if(!p)throw Error('missing exposed case');
const expanded=p.prompt.split('Failure:\n')[1].split('\nCandidates:\n')[0];
if(sha(expanded)!==p.expanded_query_sha256)throw Error('query drift');
const trace=expanded.split('\nCaller source observations:\n')[0];
const old=join(base,'defects4j-buggy-source-30-r4',p.case_id+'-checkout');
const git=args=>execFileSync('git',['-C',old,...args],{encoding:'utf8',maxBuffer:256*1024*1024});
if(git(['rev-parse','HEAD']).trim()!==p.buggy_revision||git(['status','--porcelain=v1']).trim())throw Error('bare fixture drift');
const oldPaths=git(['ls-files','-z']).split('\0').filter(x=>x.endsWith('.java'));
const oldIdentities=new Map(oldPaths.map(path=>[path,sha(readFileSync(join(old,path)))]));
const frames=frameReferences(trace).map(frame=>({frame,
  canonical:projection.sources.filter(s=>s.path===frame.suffix||s.path.endsWith('/'+frame.suffix)).map(s=>({path:s.path,source_sha256:s.sha256,...inspectFrame(readFileSync(join(exported,'corpus',s.path),'utf8'),frame)})),
  bare:oldPaths.filter(path=>path===frame.suffix||path.endsWith('/'+frame.suffix)).map(path=>({path,source_sha256:oldIdentities.get(path),...inspectFrame(readFileSync(join(old,path),'utf8'),frame)}))}));
const result={schema:'are.canonical-jxpath8-fidelity-inspection/v1',case_id:p.case_id,exposure:'already-exposed development case, not confirmation',
  projection_receipt_sha256:sha(bytes),source_tree_sha256:projection.source_tree_sha256,packet_sha256:sha(packets),frames,
  source_changes:{canonical_count:projection.sources.length,bare_count:oldPaths.length,
    added:projection.sources.filter(s=>!oldIdentities.has(s.path)).map(s=>s.path),
    modified:projection.sources.filter(s=>oldIdentities.has(s.path)&&oldIdentities.get(s.path)!==s.sha256).map(s=>s.path),
    removed:oldPaths.filter(path=>!projection.sources.some(s=>s.path===path))},
  limitations:['line range and method token are lexical checks, not execution reproduction','no compile/test or superiority claim','no historical score rewriting'],
  open_questions_owner:'G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md'};
const out=JSON.stringify(result,null,2)+'\n';writeFileSync(join(stage,'FIDELITY-INSPECTION.json'),out,{flag:'wx',mode:0o600});
console.log(JSON.stringify({case_id:p.case_id,canonical_java:projection.sources.length,added:result.source_changes.added.length,modified:result.source_changes.modified.length,removed:result.source_changes.removed.length,frames:result.frames,receipt_sha256:sha(out)}));
