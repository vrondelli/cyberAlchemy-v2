import {readFileSync,writeFileSync,readdirSync,lstatSync,realpathSync} from 'node:fs';
import {join,relative,isAbsolute} from 'node:path';
import {digest} from './analyze.mjs';

export function evidencePaths(directory) {
  const paths=['manifest.json','budgets.json','protocol.json','attempts.json','result.json'];
  for(const name of readdirSync(directory).sort()) {
    if(/^pre-\d+\.json$/.test(name))paths.push(name);
    if(/^attempt-\d+-[A-Za-z0-9]+$/.test(name)) {
      for(const file of ['attempt.json','launchflight.json','postflight.json','stdout.log','stderr.log']) {
        if(readdirSync(join(directory,name)).includes(file))paths.push(name+'/'+file);
      }
    }
  }
  return paths.sort();
}
export function readEvidenceFile(directory,path) {
  if(isAbsolute(path)||path.split('/').some(p=>!p||p==='.'||p==='..'))throw new Error('EVIDENCE_PATH_ESCAPE');
  const base=realpathSync(directory),file=join(base,path),rel=relative(base,realpathSync(file));
  if(rel.startsWith('..')||isAbsolute(rel)||!lstatSync(file).isFile()||lstatSync(file).isSymbolicLink())throw new Error('EVIDENCE_PATH_ESCAPE');
  return readFileSync(file);
}
export function sealEvidence(directory) {
  const files=evidencePaths(directory).map(path=>({path,sha256:digest(readEvidenceFile(directory,path))}));
  const bytes=JSON.stringify({schema:'cc-evidence-index/v1',files,authorityEffect:'none'},null,2)+'\n';
  writeFileSync(join(directory,'evidence-index.json'),bytes,{flag:'wx'});
  return digest(bytes);
}
export function verifyIndex(directory,expectedSha256) {
  const bytes=readEvidenceFile(directory,'evidence-index.json');
  if(!/^[a-f0-9]{64}$/.test(expectedSha256)||digest(bytes)!==expectedSha256)throw new Error('EVIDENCE_INDEX_DRIFT');
  const index=JSON.parse(bytes);
  if(index.schema!=='cc-evidence-index/v1'||JSON.stringify(index.files.map(f=>f.path))!==JSON.stringify(evidencePaths(directory)))throw new Error('EVIDENCE_COVERAGE');
  for(const f of index.files)if(digest(readEvidenceFile(directory,f.path))!==f.sha256)throw new Error('EVIDENCE_FILE_DRIFT:'+f.path);
  return index;
}
