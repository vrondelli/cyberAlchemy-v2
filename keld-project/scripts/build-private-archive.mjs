import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {copyFileSync,mkdirSync,mkdtempSync,readFileSync,renameSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {materializeProductClosure,repositoryRoot} from '../../implementation/agent-reasoning-engine/src/product.mjs';
import {verifyCopiedClosure} from '../../implementation/agent-reasoning-engine/src/product-isolation.mjs';

const scripts=dirname(fileURLToPath(import.meta.url));
const out=resolve(scripts,'../evidence/private-candidate');mkdirSync(out,{recursive:true});
const temporary=mkdtempSync(resolve(tmpdir(),'keld-archive-'));
const closure=materializeProductClosure();
const run=(command,args,options={})=>{
  const result=spawnSync(command,args,{encoding:'utf8',timeout:60_000,maxBuffer:64*1024*1024,...options});
  if(result.status!==0||result.error)throw Error(`${command} failed: ${result.error?.message??result.stderr??result.status}`);
  return result.stdout;
};
try {
  const inventory=resolve(temporary,'source-closure.json');writeFileSync(inventory,JSON.stringify(closure,null,2)+'\n');
  const archive=resolve(temporary,'are-private-candidate.tar.gz');
  run('python3',[resolve(scripts,'archive.py'),'pack',inventory,repositoryRoot,archive]);
  // Determinism check uses a second temporary archive, never a retained duplicate.
  const second=resolve(temporary,'repeat.tar.gz');
  run('python3',[resolve(scripts,'archive.py'),'pack',inventory,repositoryRoot,second]);
  const bytes=readFileSync(archive);const digest=createHash('sha256').update(bytes).digest('hex');
  if(createHash('sha256').update(readFileSync(second)).digest('hex')!==digest)throw Error('Archive is not reproducible');
  rmSync(second);
  const extracted=resolve(temporary,'extracted');
  run('python3',[resolve(scripts,'archive.py'),'unpack',inventory,archive,extracted]);
  if(!verifyCopiedClosure(extracted,closure))throw Error('Extracted closure differs');
  const runtime=resolve(extracted,'cyberAlchemy-v2/implementation/agent-reasoning-engine');
  const doctor=JSON.parse(run(process.execPath,['bin/are.mjs','doctor','--json'],{cwd:runtime}));
  if(doctor.status!=='PASS'||doctor.source_closure?.closure_digest!==closure.closure_digest)throw Error('Extracted doctor failed or closure changed');
  let tests=null;
  if(process.argv.includes('--full-tests')){
    tests=JSON.parse(run(process.execPath,['bin/are.mjs','test'],{cwd:runtime,timeout:900_000,env:{...process.env,ARE_PRODUCT_TEST_EXECUTION_MODE:'isolated-source-closure'}}));
    if(tests.status!=='PASS'||tests.source_closure_digest!==closure.closure_digest||tests.execution_mode!=='isolated-source-closure')throw Error('Extracted product tests failed');
  }
  const manifest={schema_version:'keld.private-artifact/v1',product_id:closure.product_id,version:closure.product_version,
    closure_digest:closure.closure_digest,archive:'are-private-candidate.tar.gz',sha256:digest,bytes:bytes.length,
    files:closure.files.length,publication_approved:false,sale_approved:false,
    validation:{reproducible:true,extracted_integrity:true,doctor:'PASS',full_tests:tests?{status:tests.status,test_files:tests.total_test_files,test_cases:tests.total_test_cases}:null},
    limitations:['workstation toolchain; clean-machine installation unverified','distribution rights and notices unresolved','real host integration remains unverified']};
  // Promote only a fully verified local build; filenames keep retained storage bounded.
  const pending=resolve(out,'.archive.pending');
  try {
    copyFileSync(archive,pending);
    renameSync(pending,resolve(out,manifest.archive));
  } finally {rmSync(pending,{force:true});}
  writeFileSync(resolve(out,'source-closure.json'),readFileSync(inventory));
  writeFileSync(resolve(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify(manifest));
} finally {rmSync(temporary,{recursive:true,force:true});}
