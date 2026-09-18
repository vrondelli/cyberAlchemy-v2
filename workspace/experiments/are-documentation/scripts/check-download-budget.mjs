import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

export function routeAssets(manifest, roots){
 if(!Array.isArray(roots)||!roots.length)throw Error('Route roots must be nonempty');
 const visited=new Set(),assets=new Set();
 function visit(key){
  if(visited.has(key))return;
  const chunk=manifest[key];if(!chunk)throw Error(`Missing route dependency: ${key}`);
  visited.add(key);
  if(/\.(?:js|css)$/.test(chunk.file))assets.add(chunk.file);
  for(const css of chunk.css??[])assets.add(css);
  for(const dependency of chunk.imports??[])visit(dependency);
 }
 roots.forEach(visit);return [...assets].sort();
}
export function assessRoute(route,assets){
 for(const key of ['maxDecodedBytes','maxGzipBytes'])if(!Number.isSafeInteger(route[key])||route[key]<=0)throw Error(`Invalid budget: ${key}`);
 if(!assets.length)throw Error('Route has no JavaScript or CSS assets');
 const decodedBytes=assets.reduce((sum,a)=>sum+a.bytes,0),gzipBytes=assets.reduce((sum,a)=>sum+a.gzipBytes,0);
 const failures=[];
 if(decodedBytes>route.maxDecodedBytes)failures.push('decoded byte budget exceeded');
 if(gzipBytes>route.maxGzipBytes)failures.push('gzip byte budget exceeded');
 return {...route,decodedBytes,gzipBytes,assets,failures};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dist=resolve(root,'dist');
 const budget=JSON.parse(readFileSync(resolve(root,'performance-budget.json'),'utf8'));
 if(!Array.isArray(budget.routes)||!budget.routes.length)throw Error('No routes budgeted');
 const manifest=JSON.parse(readFileSync(resolve(dist,'.vite/manifest.json'),'utf8'));
 const routes=budget.routes.map(route=>assessRoute(route,routeAssets(manifest,route.roots).map(file=>{
  const bytes=readFileSync(resolve(dist,file));return {file,bytes:bytes.length,gzipBytes:gzipSync(bytes,{level:9}).length,sha256:createHash('sha256').update(bytes).digest('hex')};
 })));
 const status=routes.every(r=>!r.failures.length)?'PASS':'FAIL';
 const output=resolve(root,'evidence/performance/download-current.json');mkdirSync(dirname(output),{recursive:true});
 writeFileSync(output,JSON.stringify({schema:budget.schema,date:new Date().toISOString(),status,scope:budget.scope,compression:budget.compression,routes},null,2)+'\n');
 for(const r of routes)console.log(`${r.name}: ${(r.gzipBytes/1024).toFixed(1)} / ${(r.maxGzipBytes/1024).toFixed(0)} KiB gzip; ${(r.decodedBytes/1024).toFixed(1)} / ${(r.maxDecodedBytes/1024).toFixed(0)} KiB decoded — ${r.failures.join(', ')||'PASS'}`);
 if(status!=='PASS')process.exitCode=1;
}
