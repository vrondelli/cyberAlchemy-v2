import {loadConfig,ConfigurationError} from '../src/config.mjs';
import {startRuntime,RuntimeError} from '../src/runtime.mjs';
const [mode,path,...extra]=process.argv.slice(2);
if(!['check','start'].includes(mode)||!path||extra.length){console.error('Usage: node bin/server.mjs check|start <config.json>');process.exitCode=1;}
else try{
  const config=await loadConfig(path);
  if(mode==='check')console.log(JSON.stringify({ok:true,mode:'sandbox',networkChecked:false}));
  else{
    const runtime=await startRuntime(config);
    console.log(JSON.stringify({ok:true,mode:'sandbox',origin:config.integration.auth.profile.origin}));
    for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{runtime.close().catch(()=>{process.exitCode=1;});});
  }
}catch(error){console.error(JSON.stringify(error instanceof ConfigurationError?{ok:false,error:'configuration-invalid',issues:error.issues}:{ok:false,error:error instanceof RuntimeError?error.code:'startup-failed'}));process.exitCode=1;}
