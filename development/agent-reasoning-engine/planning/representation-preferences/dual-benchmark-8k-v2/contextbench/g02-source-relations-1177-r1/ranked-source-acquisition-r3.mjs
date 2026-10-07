// G02 candidate: unique-path clause ranking plus one-hop source neighbors.
// All reads are from the pinned base checkout; hints are not source evidence.
import {createRankedSourceAcquisition as createBase,rankSourcesTool} from './ranked-source-acquisition-base.mjs';

const DEFAULT=/(?:^|\/)(?:default|defaults|config)\.(?:ya?ml|json|toml)$/i;
const SCHEMA=/\.schema\.(?:cue|json|ya?ml)$/i;
const FIXTURE=/(?:^|\/)(?:testdata|fixtures)\/.*\.(?:ya?ml|json|toml)$/i;

function explicitConfigurationTerms(problem_statement){
  if(typeof problem_statement!=='string')throw Error('relationship.invalid-problem');
  let issue=problem_statement;
  if(issue.startsWith('"'))try{const parsed=JSON.parse(issue);if(typeof parsed==='string')issue=parsed;}catch{}
  const dotted=[...issue.matchAll(/\b([a-z][a-z0-9_]*)\.([a-z][a-z0-9_-]*)(?:\.[a-z][a-z0-9_-]*)+\b/gi)];
  const pairs=[...new Set(dotted.map(m=>m[1].toLowerCase()+'\u0000'+m[2].toLowerCase()))];
  return pairs.map(pair=>pair.split('\u0000')).filter(([group,variant])=>group.length>=3&&variant.length>=3);
}

function selectSourceRelationshipHints({root,problem_statement,existingPaths=[],maximum=4}){
  if(typeof root!=='string'||!root||!Array.isArray(existingPaths)||!Number.isSafeInteger(maximum)||maximum<0||maximum>4)
    throw Error('relationship.invalid-input');
  const pairs=explicitConfigurationTerms(problem_statement);
  if(!pairs.length||maximum===0)return [];
  const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'buffer',timeout:120000,maxBuffer:16*1024*1024})
    .toString('utf8').split('\0').filter(Boolean).sort();
  const seen=new Set(existingPaths),candidates=[];
  for(const path of tracked){
    const category=DEFAULT.test(path)?'default':SCHEMA.test(path)?'schema':FIXTURE.test(path)?'fixture':null;
    if(!category||seen.has(path))continue;
    let stat;try{stat=lstatSync(join(root,path));}catch{continue;}
    if(!stat.isFile()||stat.size>256*1024)continue;
    const lines=readFileSync(join(root,path),'utf8').split(/\r?\n/);
    let best=null;
    for(const [group,variant] of pairs){
      const groupLines=[],variantLines=[];
      for(let i=0;i<lines.length;i++){
        const line=lines[i].toLowerCase();
        if(line.includes(group))groupLines.push(i);
        if(line.includes(variant))variantLines.push(i);
      }
      if(!groupLines.length||!variantLines.length)continue;
      let distance=Infinity,position=0;
      for(const gi of groupLines)for(const vi of variantLines){
        const delta=Math.abs(gi-vi);
        if(delta<distance){distance=delta;position=Math.min(gi,vi);}
      }
      const score=100-Math.min(distance,80);
      if(!best||score>best.score)best={score,position,group,variant};
    }
    if(!best||best.score<20)continue;
    candidates.push({path,kind:'relationship',relationship_category:category,
      start_line:Math.max(1,best.position-7),end_line:Math.min(lines.length,best.position+25),
      matched_terms:[best.group,best.variant],score_units:best.score});
  }
  const order={default:0,schema:1,fixture:2};
  candidates.sort((a,b)=>order[a.relationship_category]-order[b.relationship_category]||
    b.score_units-a.score_units||a.path.localeCompare(b.path));
  const selected=[];let schemas=0;
  for(const candidate of candidates){
    if(candidate.relationship_category==='schema'&&schemas>=2)continue;
    selected.push(candidate);
    if(candidate.relationship_category==='schema')schemas++;
    if(selected.length===maximum)break;
  }
  return selected;
}

function selectDeprecationClosureHints({root,problem_statement,seedPaths,existingPaths=[],maximum=3}){
  if(typeof root!=='string'||!root||typeof problem_statement!=='string'||!Array.isArray(seedPaths)||
    !Array.isArray(existingPaths)||!Number.isSafeInteger(maximum)||maximum<0||maximum>3)
    throw Error('relationship.invalid-closure-input');
  if(!/deprecat/i.test(problem_statement)||!explicitConfigurationTerms(problem_statement).length||maximum===0)return [];
  const packages=new Set(seedPaths.filter(path=>typeof path==='string'&&/(?:^|\/)config\/[^/]+\.go$/.test(path))
    .map(path=>path.slice(0,path.lastIndexOf('/'))));
  if(!packages.size)return [];
  const tracked=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'buffer',timeout:120000,maxBuffer:16*1024*1024})
    .toString('utf8').split('\0').filter(Boolean).sort();
  const seen=new Set(existingPaths),hints=[];
  for(const path of tracked){
    if(!path.endsWith('.go')||path.endsWith('_test.go')||seen.has(path)||
      !packages.has(path.slice(0,path.lastIndexOf('/'))))continue;
    let stat;try{stat=lstatSync(join(root,path));}catch{continue;}
    if(!stat.isFile()||stat.size>256*1024)continue;
    const lines=readFileSync(join(root,path),'utf8').split(/\r?\n/);
    const index=lines.findIndex(line=>/^func\s+\([^)]*\)\s+deprecations\s*\(/.test(line.trim()));
    if(index<0)continue;
    hints.push({path,kind:'deprecation-closure',start_line:Math.max(1,index-7),
      end_line:Math.min(lines.length,index+42),matched_terms:['deprecation'],score_units:100});
    if(hints.length===maximum)break;
  }
  return hints;
}

import {execFileSync} from 'node:child_process';
import {readFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';

export {rankSourcesTool};
const CODE=/\.(?:js|jsx|ts|tsx|go|py|rs|c|cc|cpp|h|hpp)$/i;
const GENERATED=/(?:_grpc\.pb\.go|\.pb\.go|\.min\.js|\.generated\.[a-z0-9]+)$/i;
const CONTRACT=/(?:^|\/)(?:[^/]*\.schema\.(?:cue|json|ya?ml)|schema\.(?:cue|json|ya?ml))$/i;
const STOP=new Set(['about','after','before','could','current','expected','actual','issue','these','there','their','would','which','through','using','storage','config','configuration','should','validation','backend','recently','certain','fields']);

export function normalizeProblem(text){
  if(typeof text!=='string'||!text.length)throw Error('ranked-source.invalid-problem');
  if(text.startsWith('"')&&text.endsWith('"')){
    try{const decoded=JSON.parse(text);if(typeof decoded==='string')return decoded;}catch{}
  }
  if(!text.includes('\n')&&text.includes('\\n'))return text.replace(/\\r\\n|\\n/g,'\n');
  return text;
}

export function boundedClauses(text,maximumBytes=1024,posture='balanced'){
  if(!['balanced','head'].includes(posture))throw Error('ranked-source.clause-posture');
  const cleaned=normalizeProblem(text).replace(/<!--[\s\S]*?-->/g,' ').replace(/https?:\/\/\S+/g,' ');
  const lines=cleaned.split(/\n+/).map(line=>line.replace(/^\s*(?:[*-]|\d+[.)])\s*/,'').trim())
    .filter(line=>line&&!/^#{1,6}\s/.test(line)&&(line.length>=24||/`|\/api\//.test(line)));
  const head=[],tail=[],firstEight=[],seen=new Set();
  for(const line of lines){
    let clause='';for(const character of line){if(Buffer.byteLength(clause+character)>maximumBytes)break;clause+=character;}
    if(!clause||seen.has(clause))continue;
    seen.add(clause);
    if(firstEight.length<8)firstEight.push(clause);
    if(head.length<4)head.push(clause);
    else {tail.push(clause);if(tail.length>4)tail.shift();}
  }
  if(head.length||tail.length)return posture==='head'?firstEight:[...head,...tail];
  const fallback=cleaned.trim().slice(0,maximumBytes);
  if(!fallback)throw Error('ranked-source.empty-primer');
  return [fallback];
}

export function identifierVariant(clause){
  const identifiers=clause.match(/\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/gi)??[];
  if(!identifiers.length)return null;
  const words=[];
  for(const identifier of identifiers.slice(0,4))for(const part of identifier.toLowerCase().split('_')){
    if(part.length<3)continue;
    words.push(part);
    if(part.length>4&&part.endsWith('s'))words.push(part.slice(0,-1));
  }
  const prefix=[...new Set(words)].join(' ');
  return prefix||null;
}

export function testPhraseVariant(clause){
  const matches=[...clause.matchAll(/\b([a-z][a-z0-9_-]{2,})\s+tests?\b/gi)];
  if(!matches.length)return null;
  return [...new Set(matches.slice(0,2).map(match=>match[1].toLowerCase()+' test'))].join(' ');
}

export function dottedConfigVariant(clause){
  const dotted=[...clause.matchAll(/\b[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){2,}\b/gi)];
  if(!dotted.length)return null;
  return [...new Set(dotted.slice(0,2).flatMap(match=>match[0].toLowerCase().split('.')))].join(' ');
}

function neighborhood({root,problem_statement,hints}){
  const paths=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'buffer',timeout:120000,maxBuffer:16*1024*1024})
    .toString('utf8').split('\0').filter(Boolean).sort();
  const tracked=new Set(paths);
  const seen=new Set(hints.map(h=>h.path));
  const terms=[...new Set((normalizeProblem(problem_statement).toLowerCase().match(/[a-z_][a-z0-9_]{2,}/g)??[])
    .filter(term=>!STOP.has(term)&&term.length>=3))].slice(0,64);
  const candidates=[];
  const add=(path,kind)=>{
    if(!tracked.has(path)||seen.has(path)||candidates.some(x=>x.path===path))return;
    let stat;try{stat=lstatSync(join(root,path));}catch{return;}
    if(!stat.isFile()||stat.size>256*1024)return;
    const lines=readFileSync(join(root,path),'utf8').split(/\r?\n/);
    const matched=terms.filter(term=>lines.some(line=>line.toLowerCase().includes(term)));
    if(kind==='contract'&&matched.length<2)return;
    let best=0,bestCount=-1;
    for(let i=0;i<lines.length;i++){
      const count=matched.filter(term=>lines[i].toLowerCase().includes(term)).length;
      if(count>bestCount){best=i;bestCount=count;}
    }
    candidates.push({path,start_line:Math.max(1,best-7),end_line:Math.min(lines.length,best+9),
      matched_terms:matched.slice(0,8),score_units:matched.length+(kind==='sibling'?8:0),kind});
  };
  for(const hint of hints){
    if(hint.path.endsWith('_test.go'))add(hint.path.replace(/_test\.go$/,'.go'),'sibling');
    if(hint.path.endsWith('.test.js'))add(hint.path.replace(/\.test\.js$/,'.js'),'sibling');
  }
  for(const path of paths)if(CONTRACT.test(path))add(path,'contract');
  candidates.sort((a,b)=>b.score_units-a.score_units||a.path.localeCompare(b.path));
  const siblings=candidates.filter(x=>x.kind==='sibling').slice(0,2);
  const contracts=candidates.filter(x=>x.kind==='contract').slice(0,2);
  return [...siblings,...contracts];
}

export function createRankedSourceAcquisition(options){
  const headClauses=boundedClauses(options.problem_statement,1024,'head');
  const balancedClauses=boundedClauses(options.problem_statement);
  const base=createBase({...options,problem_statement:headClauses[0]});
  const queries=headClauses.map(clause=>base.query(clause));
  const focusedTexts=[...new Set(balancedClauses.flatMap(clause=>
    [identifierVariant(clause),testPhraseVariant(clause),dottedConfigVariant(clause)].filter(Boolean)))];
  const focusedQueries=focusedTexts.map(query=>base.query(query));
  const hints=[],seen=new Set();
  const add=hint=>{if(hint&&!seen.has(hint.path)){hints.push(hint);seen.add(hint.path);}};
  for(const kind of [true,false])for(let round=0;round<2;round++)for(const result of queries){
    if(hints.length>=20)break;
    add(result.hints.find(hint=>CODE.test(hint.path)===kind&&!seen.has(hint.path)));
  }
  for(const result of queries)for(const hint of result.hints){if(hints.length>=20)break;add(hint);}
  const relationships=selectSourceRelationshipHints({root:options.root,problem_statement:options.problem_statement,maximum:4});
  const relationshipByPath=new Map(relationships.map(hint=>[hint.path,hint]));
  const neighbors=neighborhood({...options,hints}).map(hint=>{
    const related=relationshipByPath.get(hint.path);
    return related?{...hint,start_line:related.start_line,end_line:related.end_line,
      matched_terms:related.matched_terms,relationship_category:related.relationship_category}:hint;
  });
  const combined=[];const combinedSeen=new Set();
  const include=hint=>{if(hint&&!combinedSeen.has(hint.path)){combined.push(hint);combinedSeen.add(hint.path);}};
  for(const hint of hints.slice(0,8))include(hint);
  for(const hint of neighbors)include(hint);
  for(const hint of hints)if(combined.length<20)include(hint);
  const primer={...base.primer,hints:combined.slice(0,20)};
  const focused_source_hints=[];
  const packetRanked=[];
  for(const hint of primer.hints){if(packetRanked.length>=3)break;if(!GENERATED.test(hint.path))packetRanked.push(hint);}
  const focusedSeen=new Set([...packetRanked,...primer.hints.filter(hint=>['sibling','contract'].includes(hint.kind)).slice(0,3)]
    .map(hint=>hint.path));
  for(const hint of relationships){
    if(focusedSeen.has(hint.path))continue;
    focused_source_hints.push(hint);focusedSeen.add(hint.path);
  }
  for(const hint of selectDeprecationClosureHints({root:options.root,problem_statement:options.problem_statement,
    seedPaths:primer.hints.map(item=>item.path),existingPaths:[...focusedSeen],maximum:3})){
    if(focused_source_hints.length>=6)break;
    focused_source_hints.push(hint);focusedSeen.add(hint.path);
  }
  for(const result of focusedQueries){
    if(focused_source_hints.length>=6)break;
    const hint=result.hints.find(item=>CODE.test(item.path)&&!focusedSeen.has(item.path));
    if(hint){focused_source_hints.push(hint);focusedSeen.add(hint.path);}
  }
  const summary='Deterministic pinned-base leads, including unique-path and source-neighborhood candidates; not evidence. '+
    'Inspect relevant code, schema/contract and sibling implementation leads with read_file before relying on them. '+
    'Before final selection, check each distinct issue requirement against delivered source, including configuration fixtures and nearby tests. '+
    'For relevant source already found, use read_file at base revision to re-read short, exact line ranges around the responsible symbols or tests; prefer those focused read_ids over broad discovery reads in the final selection. '+
    'If the final summary cites a source path, include its delivered base read_id when that source supports the answer. Do not include irrelevant paths merely for coverage. '+
    'Do not select a path solely because it is listed: '+JSON.stringify(primer.hints.map(
      ({path,start_line,end_line,matched_terms})=>({path,start_line,end_line,matched_terms})));
  if(Buffer.byteLength(summary)>16384)throw Error('ranked-source.primer-too-large');
  return Object.freeze({query:base.query,primer,summary,focused_source_hints});
}
