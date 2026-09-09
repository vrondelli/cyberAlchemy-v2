import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import prior from '../latency-comparison-002/vite.config.mjs';
import wdio from '../../../runtime/wdio/vite.config.mjs';
const here=fileURLToPath(new URL('./',import.meta.url));
const arm=process.env.WLC_ARM;
const identity=JSON.parse(readFileSync(here+'build-inputs.json'));
const buildId=createHash('sha256').update(JSON.stringify({arm,identity})).digest('hex');
export default {
  ...prior,
  define:{__WLC_BUILD_ID__:JSON.stringify(buildId),__WLC_ARM__:JSON.stringify(arm)},
  plugins:[...prior.plugins,...wdio.plugins.slice(1),{
    name:'wlc-receipt-export',
    resolveId(id){if(id==='/wlc-receipt-export.ts')return here+'receipt-export.ts';},
    transformIndexHtml:{order:'pre',handler(){return [{tag:'script',attrs:{type:'module',src:'/wlc-receipt-export.ts'},injectTo:'head-prepend'}];}},
  }],
  build:{...prior.build,outDir:here+'dist/'+arm,emptyOutDir:false},
};
