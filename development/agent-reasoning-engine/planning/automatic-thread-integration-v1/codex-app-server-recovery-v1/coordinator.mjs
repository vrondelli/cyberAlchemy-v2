import {openAppServerHost} from './app-server-host.mjs';
import {runRecovery} from '../codex-host-recovery-v1/supervisor.mjs';
const options = JSON.parse(process.argv[2]);
let host;
const stop = label => {
  if (label !== options.crash) return;
  process.send?.({type:'boundary',label});
  // Intentional test pause: parent kills both real processes at this boundary.
  return new Promise(() => {});
};
try {
  host = await openAppServerHost({...options,onServer:identity => process.send?.({type:'server',identity}),fault:stop});
  if (options.probe) {
    const checks = [];
    for (const gate of [
      {endpoint:'https://example.invalid/gate',scope:'offline',maximum_output_tokens:32},
      {endpoint:'http://127.0.0.1:1/gate',scope:'offline',maximum_output_tokens:0},
      {endpoint:'http://127.0.0.1:1/gate',scope:'offline',maximum_output_tokens:32,unexpected:true},
    ]) {
      let rejected = false;
      try {await host.rpc.request('thread/start',{config:{experimental_context_gate:gate}});}
      catch (error) {rejected = /invalid experimental context gate|unknown field/.test(error.message);}
      if (!rejected) throw Error('invalid gate configuration was not rejected');
      checks.push('rejected');
    }
    const ordinary = await host.rpc.request('thread/start',{});
    if (!ordinary.thread?.id) throw Error('default configuration did not start');
    process.send?.({type:'result',checks,default_start:'PASS'});
  } else {
  const outcome = await runRecovery({directory:`${options.directory}/supervisor`,task_id:'offline-app-server-task',host,state:{
    objective:'Complete four bounded offline answers while preserving this task.',constraints:['No tools.','Keep the user preference: concise answers.'],completed:[],
    pending:[1,2,3,4].map(i => ({id:`answer-${i}`,kind:'provider'})),facts:['This is an offline mock.'],lessons:['Prefer concise answers.'],evidence_refs:['offline-fixture:v1']},
    fault(label) {if (label === options.crash) {process.send?.({type:'boundary',label}); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0);}}});
  process.send?.({type:'result',outcome,routing:host.snapshot()});
  }
} catch (error) {process.send?.({type:'error',message:error.message});process.exitCode=1;}
finally {await host?.close();process.disconnect?.();}
