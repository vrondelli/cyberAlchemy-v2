import {readFileSync,readlinkSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export function processIdentity(pid){
  if(!Number.isSafeInteger(pid)||pid<=0)throw Error('invalid-pid');
  const stat=readFileSync(`/proc/${pid}/stat`,'utf8');
  const fields=stat.slice(stat.lastIndexOf(')')+2).trim().split(/\s+/);
  return {pid,start_ticks:fields[19],boot_id:readFileSync('/proc/sys/kernel/random/boot_id','utf8').trim(),
    executable:readlinkSync(`/proc/${pid}/exe`),binary_sha256:sha(readFileSync(`/proc/${pid}/exe`))};
}
export function verifyProcess(before,after,expected){
  return before.pid===after.pid&&before.start_ticks===after.start_ticks&&before.boot_id===after.boot_id
    &&before.executable===expected.path&&after.executable===expected.path
    &&before.binary_sha256===expected.sha256&&after.binary_sha256===expected.sha256;
}
