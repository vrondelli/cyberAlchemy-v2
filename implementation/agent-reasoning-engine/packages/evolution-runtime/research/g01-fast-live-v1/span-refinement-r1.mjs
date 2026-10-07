// Gold-blind, source-only development transform of already selected G01 spans.
// Never use a reference patch or score here. A refined span must be contained
// in the original receipt-derived final selection and leaves file IDs intact.
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync} from 'node:fs';
import {join, resolve, sep} from 'node:path';

const sha = value => createHash('sha256').update(value).digest('hex');
const need = (value, code) => { if (!value) throw Error(`g01-span-refine.${code}`); };
const stop = new Set(['add','allow','and','bug','change','closes','example','feat','feature','fix','for','from','have','into','issue','make','new','not','our','should','support','the','this','use','using','when','with']);
const words = text => (String(text).match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])|[0-9]+/g) ?? []).map(x => x.toLowerCase());
const taskTerms = text => new Set(words(text.split(/\r?\n\s*\r?\n/,1)[0].slice(0,420)).map(x=>x.endsWith('s')&&x.length>4?x.slice(0,-1):x).filter(x => x.length >= 3 && !stop.has(x)));
function goCodeLines(lines){
  let raw=false,block=false;
  return lines.map(line=>{
    let out='',quote=null;
    for(let i=0;i<line.length;i++){
      const c=line[i],next=line[i+1];
      if(raw){if(c==='`')raw=false;continue;}
      if(block){if(c==='*'&&next==='/'){block=false;i++;}continue;}
      if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote=null;else if(quote==='"')out+=c;continue;}
      if(c==='/'&&next==='/')break;
      if(c==='/'&&next==='*'){block=true;i++;continue;}
      if(c==='`'){raw=true;continue;}
      if(c==='"'||c==="'"){quote=c;continue;}
      out+=c;
    }
    return out;
  });
}
const merge = spans => {
  const ordered = spans.map(x => ({start:x.start,end:x.end})).sort((a,b)=>a.start-b.start||a.end-b.end), out=[];
  for (const span of ordered) {
    need(Number.isSafeInteger(span.start) && Number.isSafeInteger(span.end) && span.start >= 1 && span.end >= span.start, 'invalid-span');
    if (out.length && span.start <= out.at(-1).end + 1) out.at(-1).end = Math.max(out.at(-1).end, span.end);
    else out.push(span);
  }
  return out;
};

export function refineSelectedSpans({prediction, problemStatement, sourceForPath}) {
  need(prediction?.traj_data && typeof problemStatement === 'string' && typeof sourceForPath === 'function', 'input');
  const copy=structuredClone(prediction), traj=copy.traj_data, terms=taskTerms(problemStatement), changes=[];
  need(Array.isArray(traj.pred_files) && traj.pred_spans && typeof traj.pred_spans === 'object' &&
    new Set(traj.pred_files).size === traj.pred_files.length &&
    [...traj.pred_files].sort().join('\0') === Object.keys(traj.pred_spans).sort().join('\0'), 'prediction-files');
  for (const path of traj.pred_files) {
    if(!path.endsWith('.go'))continue;
    const original=traj.pred_spans[path];
    need(Array.isArray(original) && original.length > 0, 'prediction-spans');
    const covered=merge(original);
    if (covered.length !== 1 || covered[0].end-covered[0].start+1 < 120 || terms.size < 2) continue;
    const text=sourceForPath(path), lines=text.split('\n');
    if (text.endsWith('\n')) lines.pop();
    const code=goCodeLines(lines);
    const {start,end}=covered[0], window=32;
    need(end <= lines.length, 'source-span-out-of-bounds');
    const counts=new Map();
    for (let line=start;line<=end;line++) for (const term of new Set(words(code[line-1]))) if(terms.has(term)) counts.set(term,(counts.get(term)??0)+1);
    const weights=new Map([...counts].map(([term,count])=>[term,1/Math.sqrt(count)]));
    let best=null;
    for(let begin=start;begin+window-1<=end;begin++){
      const seen=new Set();let score=0,centerPenalty=0;
      for(let line=begin;line<begin+window;line++) for(const term of new Set(words(code[line-1]))) if(weights.has(term)){const weight=weights.get(term);score+=weight;centerPenalty+=weight*Math.abs(line-(begin+(window-1)/2));seen.add(term);}
      const rare=[...seen].filter(term=>counts.get(term)<=3).length;
      if(seen.size<2 || rare<1)continue;
      const candidate={start:begin,end:begin+window-1,score,centerPenalty,distinct_terms:seen.size,rare_terms:rare};
      if(!best || candidate.score>best.score+1e-9 || (Math.abs(candidate.score-best.score)<1e-9 && (candidate.rare_terms>best.rare_terms || (candidate.rare_terms===best.rare_terms && candidate.centerPenalty<best.centerPenalty-1e-9))))best=candidate;
    }
    if(!best)continue;
    traj.pred_spans[path]=[{start:best.start,end:best.end}];
    changes.push({path,original_spans:original,refined_spans:traj.pred_spans[path],lexical_score:Number(best.score.toFixed(6)),distinct_task_terms:best.distinct_terms,rare_task_terms:best.rare_terms});
  }
  return {prediction:copy,changes,policy:'Go code and executable string literals (comments and raw help text removed); single contiguous selected span >=120 lines; gold-blind task-term rarity; one contained 32-line window with >=2 terms including a rare term; file set unchanged'};
}

export function stageExposedCohort({campaignRoot, campaignFreezeSha256, outputRoot}) {
  need([campaignRoot,outputRoot].every(x=>typeof x==='string'&&x.startsWith('/')&&resolve(x)===x), 'absolute-roots');
  const freezePath=join(campaignRoot,'CAMPAIGN-FREEZE.json'), freezeBytes=readFileSync(freezePath);
  need(sha(freezeBytes)===campaignFreezeSha256, 'campaign-freeze-drift');
  const freeze=JSON.parse(freezeBytes);
  need(freeze.schema_version==='are.g01-campaign-freeze/v1' && !existsSync(outputRoot), 'fresh-development-root');
  mkdirSync(outputRoot,{mode:0o700});
  const scriptSha256=sha(readFileSync(import.meta.filename)), rows=[];
  for(const item of freeze.ordered_tasks){
    const pair=resolve(campaignRoot,item.slug), predictionPath=join(pair,'candidate/runs/00/prediction.json');
    if(!existsSync(predictionPath)){rows.push({slug:item.slug,status:'no-native-prediction'});continue;}
    const config=JSON.parse(readFileSync(join(pair,'CONFIG.json'))), taskRow=config.tasks[0];
    need(sha(readFileSync(taskRow.task_path))===taskRow.task_sha256,'task-drift');
    const task=JSON.parse(readFileSync(taskRow.task_path)), sourceRoot=realpathSync(join(pair,'candidate/source/00/base'));
    need(task.instance_id===item.instance_id && task.problem_statement && task.base_commit===item.base_commit,'task-identity');
    const sourceHashes={};
    const sourceForPath=path=>{
      need(typeof path==='string'&&!path.startsWith('/')&&!path.includes('\\')&&!path.split('/').some(x=>!x||x==='.'||x==='..'),'source-path');
      const target=realpathSync(resolve(sourceRoot,path));need(target.startsWith(sourceRoot+sep),'source-escape');
      const bytes=readFileSync(target);sourceHashes[path]=sha(bytes);
      return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
    };
    const inputBytes=readFileSync(predictionPath), transformed=refineSelectedSpans({prediction:JSON.parse(inputBytes),problemStatement:task.problem_statement,sourceForPath});
    const out=join(outputRoot,item.slug);mkdirSync(out,{mode:0o700});
    const outputPath=join(out,'prediction.json');writeFileSync(outputPath,JSON.stringify(transformed.prediction,null,2)+'\n',{flag:'wx',mode:0o600});
    rows.push({slug:item.slug,status:'staged',input_prediction_sha256:sha(inputBytes),output_prediction_sha256:sha(readFileSync(outputPath)),task_sha256:taskRow.task_sha256,source_sha256_by_path:sourceHashes,changes:transformed.changes});
  }
  const manifest={schema_version:'are.g01-exposed-span-refinement/v1',status:'sealed-before-native-scoring',campaign_freeze_sha256:campaignFreezeSha256,
    script_sha256:scriptSha256,policy:'Source-only selected-span refinement; all existing candidate outputs preserved; no gold, native scores, or pair results read',rows,
    claim_ceiling:'Exposed development only; not an independent replication or product claim.',open_questions:['Does this rule improve native Span-F1 across exposed tasks without harming File-F1 or recall?']};
  const path=join(outputRoot,'PREDICTION-SEAL.json');writeFileSync(path,JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  return {seal_path:path,seal_sha256:sha(readFileSync(path)),staged:rows.filter(x=>x.status==='staged').length,changed:rows.filter(x=>x.changes?.length).length};
}

if(process.argv[1]===import.meta.filename){
  try{console.log(JSON.stringify(stageExposedCohort({campaignRoot:process.argv[2],campaignFreezeSha256:process.argv[3],outputRoot:process.argv[4]})));}
  catch(error){console.error(JSON.stringify({status:'failed',error:String(error.message)}));process.exitCode=2;}
}
