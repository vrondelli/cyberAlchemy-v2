#!/usr/bin/env node
import {cpSync,existsSync,mkdtempSync,mkdirSync,readFileSync,rmSync,unlinkSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourcePackage=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
const version=sourcePackage.version;
const rustModules=['conformance','event-execution','rust-function-builder','rust-toolchain','semantic-host'];
const localHostModules=['local-host','ontology-host','state-migration'];

export const releasePackages=[
  {
    id:'core',name:'@cyberalchemy/alchlang',bin:{alchlang:'dist/core-cli.js'},
    description:'AlchLang parser, ontology compiler and Node/TypeScript build surface.',
    omit:[...rustModules,...localHostModules,'rust-cli','local-host-cli'],omitTemplates:true,
    status:'candidate'
  },
  {
    id:'rust',name:'@cyberalchemy/alchlang-rust',bin:{'alchlang-rust':'dist/rust-cli.js'},
    description:'Optional native Rust backend for AlchLang.',
    omit:[...localHostModules,'core-cli','local-host-cli'],omitTemplates:false,
    status:'candidate'
  },
  {
    id:'local-host',name:'@cyberalchemy/alchlang-local-host',bin:{'alchlang-local-host':'dist/local-host-cli.js'},
    description:'Experimental repository-bound local deployment host for AlchLang.',
    omit:['core-cli','rust-cli'],omitTemplates:false,
    status:'experimental-repository-bound'
  }
];

function removeModule(dist,name){
  for(const suffix of ['.js','.d.ts']){
    const target=path.join(dist,`${name}${suffix}`);
    if(existsSync(target))unlinkSync(target);
  }
}

function packageReadme(spec){
  const dependency=spec.id==='core'
    ? 'This package does not contain Cargo templates, Rust compilation, local-host, Ansible, or Bubblewrap integration.'
    : spec.id==='rust'
      ? 'This package is optional. Building native targets requires the repository-locked Rust toolchain and Cargo cache.'
      : 'This experimental package requires the CyberAlchemy checkout provisioning runtime. It is not a portable public host or production deployment surface.';
  return `# ${spec.name}\n\n${spec.description}\n\n${dependency}\n\nStatus: ${spec.status}. Packaging is local candidate evidence and grants no release, publication, deployment, or authority effect.\n\n## Open Questions\n\n- What owner decision will admit a version for publication?\n- Which portability evidence is required before the experimental local-host package can leave the repository?\n`;
}

function manifest(spec){
  return {
    name:spec.name,version,description:spec.description,type:'module',engines:sourcePackage.engines,
    bin:spec.bin,files:['dist','README.md'],exports:spec.id==='core'?{'.':'./dist/index.js'}:undefined,
    peerDependencies:sourcePackage.peerDependencies,peerDependenciesMeta:sourcePackage.peerDependenciesMeta,
    keywords:['alchlang',spec.id],license:'UNLICENSED'
  };
}

export function releasePlan(){
  return releasePackages.map(spec=>({id:spec.id,name:spec.name,bin:spec.bin,status:spec.status,omitted_modules:spec.omit,omits_cargo_templates:spec.omitTemplates}));
}

export function packRelease(output=path.join(root,'package-artifacts',version,'split-release')){
  if(!existsSync(path.join(root,'dist','cli.js')))throw Error('ALCHLANG_BUILD_REQUIRED: run npm run build first');
  mkdirSync(output,{recursive:true});
  const work=mkdtempSync(path.join(tmpdir(),'alchlang-release-'));
  const artifacts=[];
  try{
    for(const spec of releasePackages){
      const stage=path.join(work,spec.id);mkdirSync(stage);
      const dist=path.join(stage,'dist');cpSync(path.join(root,'dist'),dist,{recursive:true});
      for(const name of spec.omit)removeModule(dist,name);
      if(spec.omitTemplates)rmSync(path.join(dist,'event-templates'),{recursive:true,force:true});
      writeFileSync(path.join(stage,'package.json'),JSON.stringify(manifest(spec),null,2)+'\n');
      writeFileSync(path.join(stage,'README.md'),packageReadme(spec));
      const packed=spawnSync('npm',['pack',stage,'--pack-destination',output,'--json'],{cwd:root,encoding:'utf8'});
      if(packed.status!==0)throw Error(`ALCHLANG_PACK_FAILED:${spec.id}:${packed.stderr||packed.stdout}`);
      const result=JSON.parse(packed.stdout)[0];artifacts.push({id:spec.id,name:spec.name,file:path.resolve(output,result.filename),size:result.size,integrity:result.integrity});
    }
    return {schema_version:'alchlang.split-release/v1-candidate',version,artifacts,authority_effect:'none'};
  }finally{rmSync(work,{recursive:true,force:true});}
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const result=process.argv.includes('--plan')?releasePlan():packRelease();
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
}
