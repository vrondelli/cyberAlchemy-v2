import {mkdtempSync,rmSync,mkdirSync,readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const dist=mkdtempSync(join(tmpdir(),'are-explorer-candidate-'));const env={...process.env,ARE_DOCS_DIST:dist};const steps=[];
const hash=file=>createHash('sha256').update(readFileSync(file)).digest('hex');
const sources=['main.tsx','CanvasGraph.tsx','engineGraph.ts','engineStories.ts','engineTours.ts','legacyGraphAliases.ts','canvasWorkspace.ts','FeatureGraph.tsx','DocumentationNode.tsx','documentationContent.ts','useDocumentation.tsx','CanvasRecovery.tsx','explorer.css','engine-explorer.css','featureMaps.ts'];
const before=Object.fromEntries(sources.map(f=>[f,hash('src/'+f)]));
function run(name,args){console.log('\nCHECK '+name);const r=spawnSync(process.execPath,args,{env,stdio:'inherit'});steps.push({name,status:r.status===0?'PASS':'FAIL'});if(r.status!==0)throw Error(name+' failed');}
try{
 run('documentation projection',['scripts/build-documentation.mjs','--check']);
 run('types',['node_modules/typescript/bin/tsc','--noEmit']);
 run('isolated production build',['node_modules/vite/bin/vite.js','build','--outDir',dist]);
 run('download budget',['scripts/check-download-budget.mjs']);
 run('unit contracts',['--test','scripts/canvas-workspace.test.mjs','scripts/workspace-persistence.test.mjs','scripts/download-budget.test.mjs','scripts/engine-graph.test.mjs']);
 for(const script of ['canvas-docs-proof','download-proof','manual-reader-proof','product-explorer-proof','explorer-layout-proof','product-explorer-mobile','product-explorer-recovery','product-explorer-browser-matrix'])run(script,['scripts/'+script+'.mjs']);
 run('full graph performance',['scripts/benchmark-engine-graph.mjs']);
 run('guide card performance',['scripts/benchmark-canvas.mjs','--check','--repeats=1','--output=evidence/performance/product-guide-cards.json']);
 if(sources.some(f=>before[f]!==hash('src/'+f)))throw Error('Explorer source changed during validation');
}catch(e){console.error(e);process.exitCode=1;}finally{
 const files=(dir,prefix='')=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(join(dir,e.name),prefix+e.name+'/'):e.isFile()?[prefix+e.name]:[]);
 const assets=existsSync(join(dist,'assets'))?files(join(dist,'assets')).map(f=>({file:f,sha256:hash(join(dist,'assets',f))})):[];
 try{mkdirSync('evidence/product-explorer',{recursive:true});writeFileSync('evidence/product-explorer/candidate.json',JSON.stringify({status:process.exitCode?'FAIL':'PASS',date:new Date().toISOString(),sources:before,assets,steps,buildIsolation:'temporary production output removed after validation'},null,2)+'\n');}finally{rmSync(dist,{recursive:true,force:true});}
}
