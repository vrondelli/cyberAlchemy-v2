import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadCustomerProfile} from './setup-customer-profile.mjs';

if(process.argv.length!==5)throw Error('Usage: node customer-app-server.mjs <engine-root> <project-root> <codex-binary>');
const engine=resolve(process.argv[2]),project=resolve(process.argv[3]),binary=resolve(process.argv[4]);
const loaded=await loadCustomerProfile(engine,project);
const args=[fileURLToPath(new URL('./customer-runtime.mjs',import.meta.url)),engine,project,binary];
let command=process.execPath;
if(loaded.value.reasoning_state.storage_mode==='append-only-file-fsync'){
  if(existsSync(resolve(project,'.are-keld/writer.lock')))throw Error('Legacy writer.lock exists: stop and reconcile the old launcher before migration');
  args.unshift(fileURLToPath(new URL('./with-writer-lock.py',import.meta.url)),resolve(project,'.are-keld/writer.flock'),command);
  command='python3';
}
const child=spawn(command,args,{stdio:'inherit'});
for(const signal of ['SIGTERM','SIGINT'])process.once(signal,()=>child.kill(signal));
child.once('error',error=>{console.error(error.message);process.exitCode=1});
child.once('exit',code=>process.exit(code??1));
