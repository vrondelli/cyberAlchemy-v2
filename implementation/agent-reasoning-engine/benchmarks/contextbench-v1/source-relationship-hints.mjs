// Source-only configuration relationships for a small initial evidence packet.
// This uses the issue and pinned base checkout; it never reads gold labels.
import {execFileSync} from 'node:child_process';
import {lstatSync,readFileSync} from 'node:fs';
import {join} from 'node:path';

const DEFAULT=/(?:^|\/)(?:default|defaults|config)\.(?:ya?ml|json|toml)$/i;
const SCHEMA=/\.schema\.(?:cue|json|ya?ml)$/i;
const FIXTURE=/(?:^|\/)(?:testdata|fixtures)\/.*\.(?:ya?ml|json|toml)$/i;

export function explicitConfigurationTerms(problem_statement){
  if(typeof problem_statement!=='string')throw Error('relationship.invalid-problem');
  let issue=problem_statement;
  if(issue.startsWith('"'))try{const parsed=JSON.parse(issue);if(typeof parsed==='string')issue=parsed;}catch{}
  const dotted=[...issue.matchAll(/\b([a-z][a-z0-9_]*)\.([a-z][a-z0-9_-]*)(?:\.[a-z][a-z0-9_-]*)+\b/gi)];
  const short=!dotted.length&&/config/i.test(issue)?[...issue.matchAll(/\b([a-z][a-z0-9_]*)\.([a-z][a-z0-9_-]*)\b/gi)]
    .filter(m=>!new Set(['com','org','net','go','js','ts','py','rs']).has(m[2].toLowerCase())):[];
  const pairs=[...new Set([...dotted,...short].map(m=>m[1].toLowerCase()+'\u0000'+m[2].toLowerCase()))];
  return pairs.map(pair=>pair.split('\u0000')).filter(([group,variant])=>group.length>=2&&variant.length>=3);
}

export function selectSourceRelationshipHints({root,problem_statement,existingPaths=[],maximum=4}){
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

export function selectDeprecationClosureHints({root,problem_statement,seedPaths,existingPaths=[],maximum=3}){
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

export function selectNamedConfigurationImplementationHints({root,problem_statement,seedPaths,existingPaths=[],maximum=2}){
  if(typeof root!=='string'||!root||typeof problem_statement!=='string'||!Array.isArray(seedPaths)||
    !Array.isArray(existingPaths)||!Number.isSafeInteger(maximum)||maximum<0||maximum>2)
    throw Error('relationship.invalid-named-input');
  const pairs=explicitConfigurationTerms(problem_statement);
  if(!pairs.length||maximum===0)return [];
  const packages=new Set(seedPaths.filter(path=>typeof path==='string'&&/(?:^|\/)config\/[^/]+\.go$/.test(path))
    .map(path=>path.slice(0,path.lastIndexOf('/'))));
  if(!packages.size)return [];
  const seen=new Set(existingPaths),tracked=new Set(execFileSync('git',['ls-files','-z'],
    {cwd:root,encoding:'buffer',timeout:120000,maxBuffer:16*1024*1024}).toString('utf8').split('\0').filter(Boolean));
  const hints=[];
  for(const [group,variant] of pairs)for(const directory of packages){
    const path=directory+'/'+group+'.go';
    if(!tracked.has(path)||seen.has(path))continue;
    let stat;try{stat=lstatSync(join(root,path));}catch{continue;}
    if(!stat.isFile()||stat.size>256*1024)continue;
    const lines=readFileSync(join(root,path),'utf8').split(/\r?\n/);
    const index=lines.findIndex(line=>line.toLowerCase().includes(variant));
    if(index<0)continue;
    hints.push({path,kind:'named-config-implementation',start_line:Math.max(1,index-7),
      end_line:Math.min(lines.length,index+28),matched_terms:[group,variant],score_units:100});
    seen.add(path);
    if(hints.length===maximum)return hints;
  }
  return hints;
}
