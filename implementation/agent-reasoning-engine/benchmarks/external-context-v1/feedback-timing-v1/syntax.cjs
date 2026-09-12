// Container-only project syntax checker. Never executes candidate source.
// Open questions: PLAN.md.
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const paths=JSON.parse(fs.readFileSync(0,'utf8')),results=[];
for(const path of paths){
 if(!/^packages\/svelte\/src\/[A-Za-z0-9_./-]+\.(js|ts)$/.test(path)||path.split('/').includes('..'))throw Error('unsupported source path');
 if(!fs.realpathSync(path).startsWith('/testbed/packages/svelte/src/'))throw Error('source escape');
 const bytes=fs.readFileSync(path),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
 let diagnostics=[],checker;
 if(path.endsWith('.js')){
  checker='project-node--check';
  const r=cp.spawnSync(process.execPath,['--check',path],{encoding:'utf8',timeout:5000,maxBuffer:64000});
  if(r.error||![0,1].includes(r.status))throw Error('checker execution failed');
  if(r.status===1){if(!r.stderr.includes('SyntaxError:'))throw Error('unexpected checker failure');diagnostics=[r.stderr.replaceAll('/testbed/','').slice(0,4000)];}
 }else{
  checker='project-typescript-parser';
  const ts=require(require.resolve('typescript',{paths:['/testbed']}));
  const source=ts.createSourceFile(path,bytes.toString('utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  diagnostics=source.parseDiagnostics.map(d=>{const pos=source.getLineAndCharacterOfPosition(d.start??0);return `${path}:${pos.line+1}:${pos.character+1}: ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`;}).slice(0,20);
 }
 results.push({path,sha256,checker,status:diagnostics.length?'invalid':'valid',diagnostics});
}
process.stdout.write(JSON.stringify({status:results.some(r=>r.status==='invalid')?'invalid':'valid',files:results}));
