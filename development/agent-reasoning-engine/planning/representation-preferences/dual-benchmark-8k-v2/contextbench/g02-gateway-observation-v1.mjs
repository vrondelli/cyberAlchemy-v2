// Read-only SSH observation for the exact G02 gateway boundary. It never reads secret bytes.
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {closeSync,fsyncSync,openSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const HOST='187.77.163.194',CONTAINER='are-keld-presentation-provider-gateway-1',USER='65532:65532',SECRET='/run/secrets/model_api_key';
export const G02_MACHINE_ID_SHA256='9e5cd9e7f123b500adc4463aee0f718587eed4f2b1fa7a51f876e8646fe754ac';
export const G02_GATEWAY_IMAGE_DIGEST='sha256:dbaf783163a0d1b1e6ea7cd693f1145803df7bfaa1d23d31c41c4ffd447e3361';
const stable=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b))):item);
const hash=value=>createHash('sha256').update(stable(value)).digest('hex');
const REMOTE=`set -eu; hostname; sha256sum /etc/machine-id | cut -d' ' -f1; docker inspect --format '{{.Name}}|{{.Config.User}}|{{.Image}}' ${CONTAINER}; docker exec --user ${USER} ${CONTAINER} /nodejs/bin/node --permission --allow-fs-read=${SECRET} -e "require('node:fs').accessSync('${SECRET}',require('node:fs').constants.R_OK)"; printf 'secret-readable-without-reading-bytes\\n'`;

export async function observeG02Gateway({spawn_process=spawn,now=()=>new Date().toISOString()}={}){
  if(typeof spawn_process!=='function')throw Error('g02-gateway-observation.spawn');
  const started_at=now(),child=spawn_process('ssh',['-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=10',`root@${HOST}`,REMOTE],{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';
  const code=await new Promise((resolve,reject)=>{child.stdout.on('data',chunk=>{if(stdout.length<4096)stdout+=chunk;});child.stderr.on('data',chunk=>{if(stderr.length<1024)stderr+=chunk;});child.on('error',reject);child.on('close',resolve);});
  if(code!==0)throw Error('g02-gateway-observation.ssh:'+String(stderr).replace(/[^\x20-\x7e]/g,' ').slice(0,256));
  const lines=stdout.trim().split(/\r?\n/),[container,user,image]=(lines[2]??'').split('|');
  if(lines.length!==4||lines[0]!=='srv1959838'||lines[1]!==G02_MACHINE_ID_SHA256||container!==`/${CONTAINER}`||user!==USER||image!==G02_GATEWAY_IMAGE_DIGEST||lines[3]!=='secret-readable-without-reading-bytes')throw Error('g02-gateway-observation.identity');
  const material={schema_version:'are.g02-gateway-observation/v1',host_ref:`vps:${HOST}`,observed_hostname:lines[0],machine_id_sha256:lines[1],container:CONTAINER,container_user:user,container_image_digest:image,secret_path:SECRET,
    secret_readable:true,secret_bytes_read:false,ssh_batch_mode:true,strict_host_key_checking:true,provider_calls:0,started_at,completed_at:now(),authority_effect:'none'};
  return Object.freeze({...material,observation_digest:hash(material)});
}

export function verifyG02GatewayObservation(value){
  const material={...value};delete material.observation_digest;
  const ok=value?.schema_version==='are.g02-gateway-observation/v1'&&value.host_ref===`vps:${HOST}`&&value.observed_hostname==='srv1959838'&&value.machine_id_sha256===G02_MACHINE_ID_SHA256&&value.container===CONTAINER&&value.container_user===USER&&value.container_image_digest===G02_GATEWAY_IMAGE_DIGEST&&value.secret_path===SECRET&&value.secret_readable===true&&value.secret_bytes_read===false&&value.ssh_batch_mode===true&&value.strict_host_key_checking===true&&value.provider_calls===0&&value.authority_effect==='none'&&Number.isFinite(Date.parse(value.started_at))&&Number.isFinite(Date.parse(value.completed_at))&&Date.parse(value.completed_at)>=Date.parse(value.started_at)&&value.observation_digest===hash(material);
  return Object.freeze({ok,reason_codes:ok?[]:['gateway-observation-invalid'],authority_effect:'none'});
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
  const target=resolve(process.argv[2]??'');if(!process.argv[2])throw Error('g02-gateway-observation.usage: OUTPUT');
  const receipt=await observeG02Gateway(),descriptor=openSync(target,'wx',0o600);try{writeFileSync(descriptor,JSON.stringify(receipt,null,2)+'\n');fsyncSync(descriptor);}finally{closeSync(descriptor);}process.stdout.write(JSON.stringify({status:'observed',path:target,observation_digest:receipt.observation_digest})+'\n');
}
