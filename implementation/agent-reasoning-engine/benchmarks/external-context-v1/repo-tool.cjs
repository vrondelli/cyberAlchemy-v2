// Runs only inside a task container. Open questions: README.md.
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const input=JSON.parse(fs.readFileSync(0,'utf8'));
const tracked=cp.execFileSync('git',['ls-files','-z'],{cwd:'/testbed',maxBuffer:16000000}).toString().split('\0').filter(Boolean);
const safe=p=>{if(!tracked.includes(p)||p.startsWith('.')||p.split('/').includes('..'))throw Error('path not permitted');const actual=fs.realpathSync('/testbed/'+p);if(!actual.startsWith('/testbed/')||actual.includes('/.git/'))throw Error('path escape');return actual;};
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
let out;
if(input.name==='list_files')out={paths:tracked.filter(p=>p.includes(input.args.query)).slice(0,120),limit:120};
else if(input.name==='search'){
 const r=cp.spawnSync('git',['grep','-n','-I','-F','-e',input.args.query,'--',input.args.path_prefix||'.'],{cwd:'/testbed',encoding:'utf8',maxBuffer:2000000});
 out={matches:(r.stdout||'').split('\n').filter(Boolean).slice(0,60),truncated:!!r.error||(r.stdout||'').split('\n').length>60};
}else if(input.name==='read_file'){
 const p=safe(input.args.path),b=fs.readFileSync(p);if(b.length>2000000)throw Error('file too large');
 const text=new TextDecoder('utf-8',{fatal:true}).decode(b),lines=text.split('\n'),start=input.args.start_line,end=Math.min(lines.length,start+input.args.line_count-1),slice=lines.slice(start-1,end).join('\n');
 out={path:input.args.path,start_line:start,end_line:end,total_lines:lines.length,source_sha256:digest(b),utf8:slice,byte_count:Buffer.byteLength(slice)};
}else if(input.name==='apply'){
 const updated=new Map();
 for(const e of input.args.edits){if(/(^|\/)(tests?|fixtures|\.github)(\/|$)/.test(e.path)||/\.(test|spec)\.[^/]+$/.test(e.path))throw Error('test edits forbidden');const p=safe(e.path),text=updated.get(p)??fs.readFileSync(p,'utf8');if(!e.old_text||text.split(e.old_text).length!==2)throw Error('old_text must match exactly once');updated.set(p,text.replace(e.old_text,()=>e.new_text));}
 for(const [p,text] of updated)fs.writeFileSync(p,text);
 out={patch:cp.execFileSync('git',['diff','--no-ext-diff','--binary'],{cwd:'/testbed',encoding:'utf8',maxBuffer:1000000})};
}else throw Error('unknown operation');
process.stdout.write(JSON.stringify(out));
