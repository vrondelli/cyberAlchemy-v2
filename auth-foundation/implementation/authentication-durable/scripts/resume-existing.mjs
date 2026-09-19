// Resume the installed deployment without provisioning identities or rotating keys.
import {execFileSync} from 'node:child_process';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {root,original} from './cluster.mjs';
import {ready} from '../operations/readiness.mjs';
const rotation=resolve(root,'.runtime/operations/rotation.json');
if(existsSync(rotation)&&JSON.parse(readFileSync(rotation)).status!=='complete')throw Error('Interrupted rotation requires operator recovery');
for(const file of [resolve(root,'.runtime/config.json'),resolve(root,'.runtime/security/auth-foundation-security.jar'),resolve(original,'.runtime/tls/ca.crt')]){
 if(!existsSync(file))throw Error('Existing deployment state is missing; provisioning is not automatic');
}
if(!process.env.AUTH_BODY_WAR_ROOT)throw Error('Set AUTH_BODY_WAR_ROOT to the separately owned Body War installation');
// Keep the installed image, network, volume, privilege and identity configuration.
// Creating/recreating a deployment is a separate explicit operator action.
execFileSync('docker',['start','auth-foundation-https-postgres-1','auth-durable-postgres-1','auth-foundation-https-keycloak-1','auth-foundation-https-mailpit-1','auth-foundation-https-proxy-1'],{stdio:'pipe',timeout:60000});
await ready({issuerOnly:true});
await import('./launch.mjs');
