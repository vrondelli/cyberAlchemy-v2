import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import base from '../../../runtime/vite.config.ts';
const here=fileURLToPath(new URL('./',import.meta.url));
const runtime=fileURLToPath(new URL('../../../runtime/',import.meta.url));
const arm=process.env.WLC_ARM;
if(!['baseline','treatment'].includes(arm))throw Error('WLC_ARM must be baseline or treatment');
const bindings=JSON.parse(readFileSync(here+'sources.json','utf8'));
const mapping=new Map(bindings.map(b=>[runtime+b.path,b.path.split('/').at(-1)]));
export default {
  ...base,root:runtime,
  plugins:[{
    name:'wlc-exact-overlay',enforce:'pre',
    buildStart(){
      for(const b of bindings){
        const actual=createHash('sha256').update(readFileSync(runtime+b.path)).digest('hex');
        if(actual!==b.sha256)throw Error('WLC source drift: '+b.path);
      }
    },
    resolveId(id){if(id==='wlc-startup-probe')return here+'startup-probe.ts';},
    load(id){
      const name=mapping.get(id.split('?')[0]);
      if(name)return readFileSync(here+arm+'/'+name,'utf8');
    },
  },...base.plugins],
  build:{...base.build,outDir:here+'dist/'+arm,emptyOutDir:false},
};
