import {execFileSync} from 'node:child_process';
execFileSync('systemctl',['--user','start','auth-foundation.service'],{stdio:'inherit'});
// Keep this user-logon WSL invocation alive while the local prototype is wanted.
setInterval(()=>{},60000);
