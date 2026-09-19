import {readFileSync,writeFileSync,readdirSync} from 'node:fs';import {resolve,relative,join} from 'node:path';import {createHash} from 'node:crypto';
export const root=resolve(new URL('..',import.meta.url).pathname),projects=resolve(root,'../../..'),body=resolve(projects,'body-war-v2-auth-mfa'),original=resolve(root,'../authentication-https'),sha=b=>createHash('sha256').update(b).digest('hex');
const excluded=new Set(['.git','node_modules','.tools','.runtime','evidence','dist','dist-test','data','test-results','playwright-report','.evf-runs','.evf-profiles']);
function walk(files,dir,exclude=true){for(const entry of readdirSync(dir,{withFileTypes:true})){if(exclude&&(excluded.has(entry.name)||entry.name.startsWith('.env')))continue;const path=join(dir,entry.name);if(entry.isSymbolicLink())throw Error('Unexpected source symlink');if(entry.isDirectory())walk(files,path,exclude);else files[relative(projects,path)]=sha(readFileSync(path));}}
export function snapshot(){const files={};
for(const dir of [root,resolve(root,'../session-core'),body])walk(files,dir);for(const dir of [resolve(body,'app/dist'),resolve(body,'vendor/auth/dist')])walk(files,dir,false);
for(const path of [resolve(original,'src/bridge.mjs'),resolve(original,'.runtime/auth-prototype-bridge'),resolve(root,'../../development/authentication-v1/DURABLE-SESSIONS-PLAN.md'),resolve(root,'../../development/authentication-v1/MFA-RECOVERY-PLAN.md'),resolve(root,'../../development/authentication-v1/LIFECYCLE-REPAIRS-PLAN.md'),resolve(root,'.runtime/security/auth-foundation-security.jar')])files[relative(projects,path)]=sha(readFileSync(path));
const ordered=Object.fromEntries(Object.entries(files).sort());return {source_digest:sha(JSON.stringify(ordered)),files:ordered};}

