import {mkdirSync,readFileSync,writeFileSync,readdirSync,rmSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';import {execFileSync} from 'node:child_process';import {createHash} from 'node:crypto';
const root=resolve(new URL('..',import.meta.url).pathname),runtime=resolve(root,'.runtime/security');mkdirSync(runtime,{recursive:true,mode:0o700});
const version=execFileSync('docker',['exec','auth-foundation-https-keycloak-1','/opt/keycloak/bin/kc.sh','--version'],{encoding:'utf8'});if(!version.startsWith('Keycloak 26.7.3\n'))throw Error('Provider requires reviewed Keycloak 26.7.3');
if(!existsSync(resolve(runtime,'libs')))execFileSync('docker',['cp','auth-foundation-https-keycloak-1:/opt/keycloak/lib/lib/main',resolve(runtime,'libs')],{stdio:'pipe'});
// On repeated builds Docker copies main underneath an existing libs directory.
const libs=readdirSync(resolve(runtime,'libs')).some(n=>n.endsWith('.jar'))?'libs':'libs/main';
rmSync(resolve(runtime,'classes'),{recursive:true,force:true});
const image='eclipse-temurin@sha256:85f00967bcc624fc19fa9c2cf124ea426a5363898e267141726f31f358c2e14b';
execFileSync('docker',['run','--rm','--network','none','--user',process.getuid()+':'+process.getgid(),'-v',root+':/work','-w','/work',image,'sh','-c',`mkdir -p .runtime/security/classes && javac --release 21 -cp '.runtime/security/${libs}/*' -d .runtime/security/classes security/src/auth/foundation/*.java && cp -r security/resources/META-INF .runtime/security/classes/ && jar --create --date=2026-09-07T00:00:00Z --file .runtime/security/auth-foundation-security.jar -C .runtime/security/classes .`],{stdio:'inherit'});
const digest=createHash('sha256').update(readFileSync(resolve(runtime,'auth-foundation-security.jar'))).digest('hex');writeFileSync(resolve(runtime,'build.json'),JSON.stringify({keycloak:'26.7.3',jdk_image:image,jar_sha256:digest,authority_effect:'none'}));console.log('Security provider compiled against the installed Keycloak libraries');
