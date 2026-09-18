import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {dirname, resolve, posix} from 'node:path';
import {fileURLToPath} from 'node:url';
import {materializeProductClosure, repositoryRoot} from '../../implementation/agent-reasoning-engine/src/product.mjs';

// File classification is review assistance, never permission to distribute.
export function classify(path) {
  if (path.includes('/node_modules/')) return 'bundled-dependency';
  if (/(^|\/)(generated|assessments|evidence)(\/|$)/.test(path)) return 'generated-evidence';
  if (/(^|\/)(test|tests|fixtures|benchmarks)(\/|$)|\.test\./.test(path)) return 'test-or-benchmark';
  if (/\.(md|txt)$/i.test(path)) return 'documentation';
  return 'source-or-configuration';
}

export function inventory(closure, read) {
  const packages = [];
  const licenses = closure.files.filter(f => !/\.(?:mjs|cjs|js|ts|py|rs|sh)$/i.test(f.path) && /^(?:(?:LICENSE|LICENCE|NOTICE|COPYING|COPYRIGHT)(?:[._-]|$)|ThirdPartyNoticeText(?:\.|$)|THIRD[-_ ]PARTY[-_ ](?:NOTICES?|LICENSES?)(?:[._-]|$))/i.test(posix.basename(f.path))).map(f => f.path);
  for (const file of closure.files.filter(f => posix.basename(f.path) === 'package.json')) {
    const data = JSON.parse(read(file.path));
    packages.push({path:file.path, root:posix.dirname(file.path), name:data.name ?? null,
      version:data.version ?? null, declared_license:data.license ?? null,
      private:data.private === true, dependencies:data.dependencies ?? {},
      optional_dependencies:data.optionalDependencies ?? {}, peer_dependencies:data.peerDependencies ?? {},
      engines:data.engines ?? {}, notice_files:licenses.filter(p => posix.dirname(p) === posix.dirname(file.path))});
  }
  packages.sort((a,b) => b.root.length-a.root.length || a.root.localeCompare(b.root));
  const files = closure.files.map(file => {
    const owner = packages.find(p => file.path.startsWith(p.root+'/'));
    return {path:file.path,sha256:file.sha256,bytes:file.bytes,kind:classify(file.path),
      package_ref:owner?.path ?? null,review_status:'unreviewed'};
  });
  const groups = {};
  for (const file of files) {
    const key = file.package_ref ?? file.path.split('/').slice(0,3).join('/') + ' (no package manifest)';
    const group = groups[key] ??= {files:0,bytes:0,categories:{}};
    group.files++; group.bytes+=file.bytes;
    group.categories[file.kind]=(group.categories[file.kind]??0)+1;
  }
  return {schema_version:'keld.distribution-inventory/v1',closure_digest:closure.closure_digest,
    product_id:closure.product_id,version:closure.product_version,publication_approved:false,
    limitation:'Package metadata and adjacent notices are evidence only. Non-JavaScript dependencies, imports outside manifests, rights and content require review.',
    packages,license_files:licenses,groups,files};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let result;
  if(process.argv.includes('--archive')){
    const candidate=resolve(dirname(fileURLToPath(import.meta.url)),'../evidence/private-candidate');
    const archive=resolve(candidate,'are-private-candidate.tar.gz');
    const manifest=JSON.parse(readFileSync(resolve(candidate,'manifest.json'),'utf8'));
    if(createHash('sha256').update(readFileSync(archive)).digest('hex')!==manifest.sha256)throw Error('Archive hash mismatch');
    const closure=JSON.parse(readFileSync(resolve(candidate,'source-closure.json'),'utf8'));
    const script="import json,tarfile,sys; t=tarfile.open(sys.argv[1],'r:gz'); print(json.dumps({m.name:t.extractfile(m).read().decode('utf-8') for m in t if m.isfile() and m.name.endswith('/package.json')}))";
    const packages=JSON.parse(execFileSync('python3',['-c',script,archive],{encoding:'utf8',maxBuffer:4*1024*1024}));
    result=inventory(closure,p=>{
      const bytes=packages[p];const expected=closure.files.find(f=>f.path===p);
      if(typeof bytes!=='string'||createHash('sha256').update(bytes).digest('hex')!==expected.sha256)throw Error('Archived package mismatch');
      return bytes;
    });
    result.archive_sha256=manifest.sha256;
  }else result = inventory(materializeProductClosure(), p => readFileSync(resolve(repositoryRoot,p),'utf8'));
  const out=resolve(dirname(fileURLToPath(import.meta.url)),'../evidence');mkdirSync(out,{recursive:true});
  writeFileSync(resolve(out,'distribution-inventory.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({files:result.files.length,packages:result.packages.length,
    packages_without_declared_license:result.packages.filter(p=>!p.declared_license).length,
    packages_without_adjacent_notice:result.packages.filter(p=>!p.notice_files.length).length,
    license_files:result.license_files.length,closure_digest:result.closure_digest}));
}
