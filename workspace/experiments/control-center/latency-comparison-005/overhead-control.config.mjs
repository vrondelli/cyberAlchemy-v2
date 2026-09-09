import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import wdio from '../../../runtime/wdio/vite.config.mjs';
const runtime=fileURLToPath(new URL('../../../runtime/',import.meta.url));
const here=fileURLToPath(new URL('./',import.meta.url));
const bindings=JSON.parse(readFileSync(new URL('../latency-comparison-002/sources.json',import.meta.url)));
export default {...wdio,root:runtime,plugins:[...wdio.plugins,{
  name:'wlc-uninstrumented-source-check',
  buildStart(){for(const b of bindings)if(createHash('sha256').update(readFileSync(runtime+b.path)).digest('hex')!==b.sha256)throw Error('selected-source-drift:'+b.path);},
}],build:{sourcemap:true,outDir:here+'dist/uninstrumented',emptyOutDir:false}};
