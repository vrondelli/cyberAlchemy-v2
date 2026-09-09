import {config as base} from './base.wdio.conf.mjs';
import {installProbe} from './probe.mjs';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
let sequence=0;
async function capture(){
  const result=await browser.execute(()=>window.__WLC016__?.finish()??{coverage:'missing',authority_effect:'none'});
  const dir=process.env.WORKSPACE_WDIO_OUTPUT;
  mkdirSync(dir,{recursive:true});
  writeFileSync(join(dir,`profile-${++sequence}.json`),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
}
export const config={...base,
  async before(){
    await browser.execute(installProbe);
    browser.overwriteCommand('reloadSession',async function(original,...args){
      await capture();
      const value=await original(...args);
      await browser.execute(installProbe);
      return value;
    });
  },
  async afterTest(){await capture();},
};
