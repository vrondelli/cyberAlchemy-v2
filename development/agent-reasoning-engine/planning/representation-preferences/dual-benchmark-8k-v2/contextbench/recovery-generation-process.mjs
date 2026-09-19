// Process boundary for local socket settlement. Open questions: RECOVERY-LAUNCHER.md.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const WORKER=fileURLToPath(new URL('./recovery-generation-worker.mjs',import.meta.url));
const MAX_OUTPUT=8*1024*1024,MAX_INPUT=1024*1024;
export function createGenerationProcess({worker=WORKER,kill_grace_ms=150000}={}){
 if(process.platform!=='linux')throw Error('recovery-process.linux-process-group-required');
 if(!Number.isSafeInteger(kill_grace_ms)||kill_grace_ms<1||kill_grace_ms>150000)throw Error('recovery-process.kill-grace');
 let used=false,closed=null,expected=null;
 async function generate({config,evidence_root,source_root,binding,signal}){
  if(used)throw Error('recovery-process.single-use');used=true;
  if(signal?.aborted)throw Error('recovery-process.cancelled-before-spawn');
  const input=JSON.stringify({config,evidence_root,source_root,binding});
  if(Buffer.byteLength(input)>MAX_INPUT)throw Error('recovery-process.input-limit');
  return await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,[worker],{stdio:['pipe','pipe','pipe'],detached:true});
   let output=[],bytes=0,stderrBytes=0,failure=null,killTimer=null,forced=false;
   const killGroup=kind=>{if(!child.pid)return;try{process.kill(-child.pid,kind);}catch(e){if(e.code!=='ESRCH')failure??='process-group-signal-failed';}};
   const groupExists=()=>{if(!child.pid)return false;try{process.kill(-child.pid,0);return true;}catch(e){return e.code!=='ESRCH';}};
   const stop=()=>{killGroup('SIGTERM');killTimer??=setTimeout(()=>{forced=true;killGroup('SIGKILL');},kill_grace_ms);};
   const fail=message=>{failure??=message;stop();};
   signal?.addEventListener('abort',stop,{once:true});
   if(signal?.aborted)stop();
   child.on('error',()=>{failure??='spawn-failed';});
   child.on('exit',()=>{if(groupExists()){forced=true;killGroup('SIGKILL');}});
   child.stdin.on('error',()=>{failure??='input-failed';});
   child.stdout.on('data',chunk=>{bytes+=chunk.length;if(bytes>MAX_OUTPUT){fail('output-limit');return;}output.push(chunk);});
   child.stderr.on('data',chunk=>{stderrBytes+=chunk.length;if(stderrBytes>4096)fail('stderr-limit');});
   child.on('close',async(code,termination_signal)=>{
    clearTimeout(killTimer);signal?.removeEventListener('abort',stop);
    // No descendant native tool may outlive the generation boundary.
    if(groupExists()){forced=true;killGroup('SIGKILL');}
    const until=Date.now()+5000;while(groupExists()&&Date.now()<until)await new Promise(r=>setTimeout(r,20));
    const process_group_absent=!groupExists();if(!process_group_absent)failure??='process-group-not-settled';
    closed={local_settled:process_group_absent,process_group_absent,child_pid:child.pid??null,exit_code:code,termination_signal,forced,stderr_bytes:stderrBytes,remote_completion_claimed:false};
    let message;
    try{if(bytes>MAX_OUTPUT)throw Error();message=JSON.parse(Buffer.concat(output).toString('utf8'));}
    catch{failure??='terminal-missing-or-invalid';}
    expected=message?.terminal??null;
    if(failure||code!==0||message?.error){reject(Object.assign(Error('recovery-process.'+(failure??message?.error??'child-failed')),{result:expected,process_settlement:closed}));}
    else resolve(expected);
   });
   child.stdin.end(input);
  });
 }
 async function settle({terminal}){
  if(!closed)throw Error('recovery-process.not-closed');
  if(JSON.stringify(terminal)!==JSON.stringify(expected))throw Error('recovery-process.terminal-mismatch');
  return {...closed};
 }
 return Object.freeze({generate,settle});
}
