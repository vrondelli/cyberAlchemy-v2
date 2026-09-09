import {runRecovery} from './supervisor.mjs';
import {fixtureHost,fixtureState} from './fixture-host.mjs';
const [directory, boundary, epoch='0'] = process.argv.slice(2);
const result=await runRecovery({directory,task_id:'crash-task',state:fixtureState(),host:fixtureHost(directory),
  fault(label,journal){if(label===boundary && journal.generation===Number(epoch)) process.kill(process.pid,'SIGKILL');}});
process.stdout.write(JSON.stringify(result));
