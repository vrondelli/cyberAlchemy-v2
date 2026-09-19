// JSON-lines bridge to the existing native storage guard. No network.
// Open questions: ACQUISITION.md.
import {createInterface} from 'node:readline';
import {existsSync} from 'node:fs';
import {assertStorageCapacity} from '../../../../../../../implementation/agent-reasoning-engine/benchmarks/contextbench-v1/storage-lifecycle.mjs';
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
 try{
  const {outRoot}=JSON.parse(line);
  if(!existsSync('/mnt/c'))throw Error('acquisition.host-storage-measurement-unavailable');
  const receipt=assertStorageCapacity({outRoot,hostRoot:'/mnt/c',minimumFreeBytes:8*1024**3,minimumHostFreeBytes:12*1024**3});
  process.stdout.write(JSON.stringify({ok:true,receipt})+'\n');
 }catch(error){process.stdout.write(JSON.stringify({ok:false,error:String(error.message),receipt:error.receipt??null})+'\n');}
}
