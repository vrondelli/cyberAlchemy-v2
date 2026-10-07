#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {copyFileSync,existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkPackageBoundaries} from './materialize-package-boundaries.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourcePackage=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
const version=sourcePackage.version;
const descriptions={
  core:'AlchLang parser, exact authoring compiler and Node/TypeScript application build surface.',
  rust:'Optional native Rust generation and conformance layer for AlchLang.',
  'local-host':'Experimental repository-bound local host layer for AlchLang.'
};
const usage={
  core:'Use `alchlang check <application.alch>` and `alchlang build <application.alch> --out <new-directory>`. The installed DomainSpec bridge requires the exact optional peer package or `ALCHLANG_DOMAINSPEC_PACKAGE_ROOT`.',
  rust:'Use `alchlang-rust check <file.alch>` for Rust profiles. Cargo and the locked native toolchain are required only for native build or conformance operations.',
  'local-host':'Use `alchlang-local-host check <file.alch>` for the experimental local-host profiles. This package is repository-bound and is not a portable or production deployment surface.'
};

const sha256=value=>createHash('sha256').update(value).digest('hex');
const sorted=value=>[...value].sort();
const copyAllowed=(stage,boundary)=>{
  for(const relative of boundary.files){
    if(relative==='package.json'||relative==='README.md')continue;
    const source=path.join(root,relative),destination=path.join(stage,relative);
    if(!existsSync(source))throw Error(`ALCHLANG_PACKAGE_ALLOWLIST_SOURCE_MISSING:${boundary.id}:${relative}`);
    mkdirSync(path.dirname(destination),{recursive:true});copyFileSync(source,destination);
  }
};
const packageReadme=boundary=>`# ${boundary.name}\n\n${descriptions[boundary.id]}\n\n${usage[boundary.id]}\n\nThe exact candidate file allowlist and export map are recorded in the source package's \`package-boundaries.json\`. Packaging is local construction evidence only and grants no publication, release, deployment, product approval, production claim, or authority effect.\n\n## Open Questions\n\n- P02 owns installation and execution from these archives in clean consumers.\n- What owner decision will admit one frozen candidate for product validation?\n`;
const manifest=boundary=>({
  name:boundary.name,version,description:descriptions[boundary.id],type:'module',engines:sourcePackage.engines,
  bin:boundary.bin,exports:boundary.exports,files:boundary.files.filter(file=>file!=='package.json'),
  peerDependencies:sourcePackage.peerDependencies,peerDependenciesMeta:sourcePackage.peerDependenciesMeta,
  keywords:['alchlang',boundary.id],license:'UNLICENSED'
});

export function releasePlan(){
  const boundary=checkPackageBoundaries();
  return boundary.packages.map(item=>({id:item.id,name:item.name,bin:item.bin,exports:item.exports,status:item.status,
    file_count:item.files.length,allowlist_sha256:item.allowlist_sha256,omitted_modules:item.omitted_modules,
    omits_cargo_templates:!item.includes_cargo_templates,checkout_only_imports_allowed:item.checkout_only_imports_allowed}));
}

export function packRelease(output=path.join(root,'package-artifacts',version,'split-release')){
  const boundary=checkPackageBoundaries();
  mkdirSync(output,{recursive:true});
  const work=mkdtempSync(path.join(tmpdir(),'alchlang-release-'));
  const artifacts=[];
  try{
    for(const spec of boundary.packages){
      const stage=path.join(work,spec.id);mkdirSync(stage);copyAllowed(stage,spec);
      writeFileSync(path.join(stage,'package.json'),JSON.stringify(manifest(spec),null,2)+'\n');
      writeFileSync(path.join(stage,'README.md'),packageReadme(spec));
      const packed=spawnSync('npm',['pack',stage,'--pack-destination',output,'--json'],{cwd:root,encoding:'utf8'});
      if(packed.status!==0)throw Error(`ALCHLANG_PACK_FAILED:${spec.id}:${packed.stderr||packed.stdout}`);
      const result=JSON.parse(packed.stdout)[0];
      const actual=sorted(result.files.map(item=>item.path)),expected=sorted(spec.files);
      if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error(`ALCHLANG_PACKAGE_INVENTORY_MISMATCH:${spec.id}`);
      artifacts.push({id:spec.id,name:spec.name,file:path.resolve(output,result.filename),size:result.size,integrity:result.integrity,
        shasum:result.shasum,file_count:actual.length,allowlist_sha256:sha256(JSON.stringify(actual)),exports:spec.exports});
    }
    return {schema_version:'alchlang.split-release/v2-candidate',version,package_boundary_sha256:sha256(readFileSync(path.join(root,'package-boundaries.json'))),
      artifacts,publication_performed:false,installation_performed:false,authority_effect:'none'};
  }finally{rmSync(work,{recursive:true,force:true});}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=process.argv.includes('--plan')?releasePlan():packRelease();
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
