// Open questions: ../../plans/orchestrator-integration/T7-ACCEPTANCE.md.
import {accessSync,constants} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const runtime=fileURLToPath(new URL('../',import.meta.url));
export const appBinaryPath=resolve(runtime,'../../essays/development/agent-runtime/implementation/desktop/src-tauri/target/debug',process.platform==='win32'?'essays-desktop.exe':'essays-desktop');
export function nativePreflight(){
 const checks=[];
 for(const [name,path,executable] of [
  ['desktop-binary',appBinaryPath,true],
  ['wdio-frontend',resolve(runtime,'dist/index.html'),false],
  ['mock-codex',resolve(runtime,'../../development/agent-reasoning-engine/codex-integration/test/fixtures/mock-app-server.mjs'),true],
  ['are-bridge',resolve(runtime,'../../development/agent-reasoning-engine/codex-integration/client/desktop-bridge.mjs'),false],
 ]){
  try{accessSync(path,executable?constants.X_OK:constants.R_OK);checks.push({name,status:'PASS',path});}
  catch{checks.push({name,status:'BLOCKED',path,reason:'Required file missing or inaccessible'});}
 }
 if(process.platform==='linux'){
  const pkg=spawnSync('pkg-config',['--modversion','gtk+-3.0','webkit2gtk-4.1'],{encoding:'utf8',timeout:5000});
  checks.push({name:'linux-build-dependencies',status:pkg.status===0?'PASS':'BLOCKED',reason:pkg.error?.message??pkg.stderr.trim(),versions:pkg.stdout?.trim()??''});
  checks.push({name:'linux-display',status:process.env.DISPLAY||process.env.WAYLAND_DISPLAY?'PASS':'BLOCKED',reason:'Run the isolated desktop under an available display or xvfb-run'});
 }
 return {status:checks.every(c=>c.status==='PASS')?'PASS':'BLOCKED',authority_effect:'none',checks,open_questions_ref:'workspace/plans/orchestrator-integration/T7-ACCEPTANCE.md#open-questions'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=nativePreflight();console.log(JSON.stringify(result,null,2));if(result.status!=='PASS')process.exitCode=2;
}
