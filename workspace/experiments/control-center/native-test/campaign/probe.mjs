import {readFileSync} from 'node:fs';
import {cpus,hostname,release} from 'node:os';
import {setTimeout} from 'node:timers/promises';
import {digest} from './analyze.mjs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

const pressure = path => {
  const match=readFileSync(path,'utf8').match(/^some avg10=([\d.]+)/m);
  if(!match) throw new Error('PRESSURE_UNAVAILABLE:'+path);
  return Number(match[1]);
};
export const describeHost=()=>({hostname:hostname(),kernel:release(),cpuModels:cpus().map(c=>c.model)});
export function sampleHost(atMs=Date.now()) {
  const memory=readFileSync('/proc/meminfo','utf8');
  const total=Number(memory.match(/^MemTotal:\s+(\d+)/m)?.[1]);
  const available=Number(memory.match(/^MemAvailable:\s+(\d+)/m)?.[1]);
  return {atMs,normalizedLoad1:Number(readFileSync('/proc/loadavg','utf8').split(' ')[0])/cpus().length,availableMemoryFraction:available/total,cpuPressureAvg10:pressure('/proc/pressure/cpu'),memoryPressureAvg10:pressure('/proc/pressure/memory')};
}
if(process.argv[1] && pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
const host=describeHost(), observations=[];
for(let i=0;i<5;i++) {
  observations.push(sampleHost());
  if(i<4)await setTimeout(1000);
}
console.log(JSON.stringify({status:'PRELAUNCH_OBSERVATIONS_ONLY',host,hostSha256:digest(JSON.stringify(host)),observations,authorityEffect:'none',claimCeiling:'No desktop session or during-run coverage; not a qualified campaign.'},null,2));
}
