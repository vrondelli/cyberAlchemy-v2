// Container-only source delta builder. Open questions: README.md.
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),path=require('path');
const {edits}=JSON.parse(fs.readFileSync(0,'utf8'));const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const tracked=new Set(cp.execFileSync('git',['ls-files','-z']).toString().split('\0'));
const before=new Map(),after=new Map();
if(!Array.isArray(edits)||!edits.length||edits.length>6)throw Error('invalid edits');
for(const e of edits){
 if(!/^packages\/svelte\/src\/[A-Za-z0-9_./-]+\.(js|ts)$/.test(e.path)||e.path.split('/').includes('..')||!tracked.has(e.path))throw Error('source path denied');
 const real=fs.realpathSync(e.path);if(!real.startsWith('/testbed/packages/svelte/src/'))throw Error('source escape');
 if(!before.has(e.path)){const bytes=fs.readFileSync(real);if(bytes.length>2000000)throw Error('source too large');before.set(e.path,new TextDecoder('utf8',{fatal:true}).decode(bytes));}
 const text=after.get(e.path)??before.get(e.path);
 if(typeof e.old_text!=='string'||!e.old_text||e.old_text.length>12000||typeof e.new_text!=='string'||e.new_text.length>12000||text.split(e.old_text).length!==2)throw Error('old_text must match exactly once');
 after.set(e.path,text.replace(e.old_text,()=>e.new_text));
}
const temp=fs.mkdtempSync('/tmp/are-source-delta-');let patch='';const files=[];
try{
 for(const [p,text] of after){if(text===before.get(p))continue;
  for(const [d,t] of [['before',before.get(p)],['after',text]]){fs.mkdirSync(path.dirname(temp+'/'+d+'/'+p),{recursive:true});fs.writeFileSync(temp+'/'+d+'/'+p,t);}
  const r=cp.spawnSync('git',['diff','--no-index','--no-ext-diff','--binary','--','before/'+p,'after/'+p],{cwd:temp,encoding:'utf8',maxBuffer:1000000});if(r.status!==1)throw Error('diff failed');
  patch+=r.stdout.split('\n').map(l=>l.startsWith('diff --git ')?`diff --git a/${p} b/${p}`:l===`--- a/before/${p}`?`--- a/${p}`:l===`+++ b/after/${p}`?`+++ b/${p}`:l).join('\n');
  files.push({path:p,before_sha256:sha(before.get(p)),after_sha256:sha(text)});
 }
 if(!patch.trim())throw Error('empty candidate');process.stdout.write(JSON.stringify({patch,files}));
}finally{fs.rmSync(temp,{recursive:true,force:true});}
