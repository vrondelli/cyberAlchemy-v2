// Provider-free diagnostic only: simulate a future source-neighborhood read.
// Expanded lines were NOT delivered to the model; never score this as ARE output.
import {readFileSync,realpathSync,writeFileSync} from 'node:fs';
import {resolve,relative,isAbsolute,sep} from 'node:path';

const [predictionPath,repoRoot,outPath]=process.argv.slice(2);
if(!predictionPath||!repoRoot||!outPath)throw Error('neighborhood-upper-bound.arguments');
const prediction=JSON.parse(readFileSync(predictionPath,'utf8'));
const base=realpathSync(repoRoot),expanded={};
const isSource=path=>/(^|\/)(src|lib|internal)\//.test(path)&&/\.(?:[ch]|cc|cpp|go|js|jsx|ts|tsx|rs|py)$/.test(path);
for(const [path,spans] of Object.entries(prediction.traj_data.pred_spans)){
  if(!isSource(path)){expanded[path]=spans;continue;}
  const full=realpathSync(resolve(base,path)),rel=relative(base,full);
  if(!rel||rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw Error('neighborhood-upper-bound.path-escape');
  const lines=readFileSync(full,'utf8').split('\n').length;
  if(lines>200000)throw Error('neighborhood-upper-bound.file-too-large');
  expanded[path]=spans.map(span=>({start:Math.max(1,span.start-16),end:Math.min(lines,span.end+16)}));
}
const output={...prediction,traj_data:{...prediction.traj_data,pred_spans:expanded}};
writeFileSync(outPath,JSON.stringify(output,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'not-delivered-upper-bound',files:Object.keys(expanded).length}));
