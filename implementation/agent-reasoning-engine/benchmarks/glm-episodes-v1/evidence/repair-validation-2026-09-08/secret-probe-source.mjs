import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createSopsAgeProcessSecretProvider} from '/home/vrondelli/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime/sops-age-secret-provider.mjs';
import {createSecretProviderRegistry,createSecretReference,secretResolutionFailure} from '/home/vrondelli/projects/cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/coding-agent-runtime/secret-provider.mjs';
const c=JSON.parse(readFileSync('/home/vrondelli/.config/are/glm-flash-credential.json','utf8'));
const provider=createSopsAgeProcessSecretProvider({...c,python_command:'/usr/bin/python3',project_root:'/home/vrondelli/projects/domainspec-core/projects/secret-management',timeout_ms:5000});
const registry=createSecretProviderRegistry({providers:[provider]}),ref=createSecretReference({provider_id:c.provider_id,locator:c.locator});
const trials=[];
for(let i=0;i<20;i++) {
 const started=Date.now();let consumed=false,failure=null;
 try {await registry.consume({secret_ref:ref,consumer_id:'glm-flash-transport',request_digest:createHash('sha256').update(`repair-validation-28-local-secret-${i}`).digest('hex'),consumer(){consumed=true;}});}
 catch(e){failure=secretResolutionFailure(e);}
 const row={index:i,consumed,failure,elapsed_ms:Date.now()-started};trials.push(row);console.log(JSON.stringify(row));
}
writeFileSync(process.argv[2],JSON.stringify({schema_version:'are.local-secret-diagnostic/v1',authority_effect:'none',timeout_ms:5000,planned:20,completed:trials.length,automatic_retries:0,provider_calls:0,trials,open_questions_ref:'README.md#open-questions'},null,2)+'\n',{flag:'wx',mode:0o600});
