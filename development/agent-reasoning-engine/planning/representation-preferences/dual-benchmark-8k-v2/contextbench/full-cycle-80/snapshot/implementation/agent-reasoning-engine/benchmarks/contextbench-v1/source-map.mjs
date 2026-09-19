// Conservative current-source -> pinned-base line projection. Open questions: README.md.
import {createHash} from 'node:crypto';
import {mkdtempSync,writeFileSync,readFileSync,realpathSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {spawnSync} from 'node:child_process';
const hash=x=>createHash('sha256').update(x).digest('hex');
const lines=text=>{const out=text.split('\n');if(text.endsWith('\n'))out.pop();return text===''?[]:out;};
const need=(x,m)=>{if(!x)throw Error(`source-map.${m}`);};

export function unchangedLineMap(base,current){
  const a=lines(base),b=lines(current),map=new Map();
  if(base===current){for(let i=1;i<=a.length;i++)map.set(i,i);return map;}
  const temp=mkdtempSync(join(tmpdir(),'are-cb-source-map-'));
  try{
    writeFileSync(join(temp,'base'),base);writeFileSync(join(temp,'current'),current);
    const d=spawnSync('git',['-c','core.hooksPath=/dev/null','diff','--no-index','--no-ext-diff','--no-textconv','--text','--unified=0','--','base','current'],{cwd:temp,encoding:'utf8',maxBuffer:16000000});
    need(!d.error&&[0,1].includes(d.status),'diff-failed');
    const hunks=[...d.stdout.matchAll(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm)];
    need(hunks.length>0,'diff-no-hunks');
    let old=1,now=1;
    const copy=(oldEnd,newEnd)=>{
      need(oldEnd-old===newEnd-now,'unaligned-diff');
      while(old<oldEnd){need(a[old-1]===b[now-1],'unchanged-content-mismatch');map.set(now++,old++);}
    };
    for(const h of hunks){
      const oldCount=h[2]===undefined?1:Number(h[2]),newCount=h[4]===undefined?1:Number(h[4]);
      const oldStart=Number(h[1])+(oldCount===0?1:0),newStart=Number(h[3])+(newCount===0?1:0);
      copy(oldStart,newStart);old=oldStart+oldCount;now=newStart+newCount;
    }
    copy(a.length+1,b.length+1);return map;
  }finally{rmSync(temp,{recursive:true,force:true});}
}

export function projectObservationsToBase(reads,snapshots,repoRoot){
  const root=realpathSync(repoRoot),events=[],projections=[];
  for(const r of reads){
    need(typeof r.path==='string'&&!isAbsolute(r.path)&&!r.path.includes('\\')&&!r.path.split('/').some(x=>['..','.',''].includes(x)),'invalid-path');
    const path=realpathSync(resolve(root,r.path)),rel=relative(root,path);
    need(rel&&rel!=='..'&&!rel.startsWith('../')&&!isAbsolute(rel),'path-escape');
    const baseBytes=readFileSync(path),base=new TextDecoder('utf-8',{fatal:true}).decode(baseBytes),baseHash=hash(baseBytes);
    let current=base;
    if(r.source_sha256!==baseHash){
      const candidates=snapshots.filter(s=>s.path===r.path&&s.source_sha256===r.source_sha256);
      need(candidates.length>0,'snapshot-missing');
      need(candidates.every(s=>typeof s.utf8==='string'&&hash(s.utf8)===r.source_sha256),'snapshot-digest');
      current=candidates[0].utf8;
    }
    const currentLines=lines(current),baseLines=lines(base);
    need(Number.isSafeInteger(r.start_line)&&Number.isSafeInteger(r.end_line)&&r.start_line>=1&&r.end_line>=r.start_line&&r.end_line<=current.split('\n').length,'invalid-range');
    need(current.split('\n').slice(r.start_line-1,r.end_line).join('\n')===r.body,'body-mismatch');
    const map=unchangedLineMap(base,current),fragments=[];
    for(let i=r.start_line;i<=Math.min(r.end_line,currentLines.length);i++){
      const target=map.get(i);if(target===undefined)continue;
      const last=fragments.at(-1);
      if(last&&last.current_end===i-1&&last.end===target-1){last.current_end=i;last.end=target;}
      else fragments.push({current_start:i,current_end:i,start:target,end:target});
    }
    const ids=[];
    for(const f of fragments){
      const id=baseHash===r.source_sha256?r.id:`${r.id}:base:${f.start}:${f.end}`;
      const body=baseLines.slice(f.start-1,f.end).join('\n');
      if(!body.length)continue; // Blank-only observation cannot supply useful source context.
      ids.push(id);events.push({id,path:r.path,start_line:f.start,end_line:f.end,body,
        body_encoding:'legacy-line-join',source_sha256:baseHash,delivered:true,turn:r.first_confirmed_receipt});
    }
    projections.push({read_id:r.id,source_sha256:r.source_sha256,base_source_sha256:baseHash,event_ids:ids,
      fragments,unmapped_current_lines:Array.from({length:Math.max(0,Math.min(r.end_line,currentLines.length)-r.start_line+1)},(_,i)=>r.start_line+i).filter(i=>!map.has(i))});
  }
  return {events,projections,claim_ceiling:'Only exact unchanged source lines map to base coordinates. Changed/inserted lines receive no base-context credit.'};
}
