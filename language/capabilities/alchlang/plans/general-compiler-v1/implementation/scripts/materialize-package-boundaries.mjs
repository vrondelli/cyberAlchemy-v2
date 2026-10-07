#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync,readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repo=path.resolve(root,'../../../../../..');
export const boundaryPath=path.join(root,'package-boundaries.json');
const posix=value=>value.split(path.sep).join('/');
const sha256=value=>createHash('sha256').update(value).digest('hex');
const walk=(directory,prefix='')=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
  const relative=posix(path.join(prefix,entry.name));
  return entry.isDirectory()?walk(path.join(directory,entry.name),relative):[relative];
}).sort();
const readJson=file=>JSON.parse(readFileSync(file,'utf8'));
const packageSource=readJson(path.join(root,'package.json'));

const rustModules=['conformance','event-execution','rust-function-builder','rust-toolchain','semantic-host'];
const localHostModules=['local-host','ontology-host','state-migration'];
const packageSpecs=[
  {id:'core',name:'@cyberalchemy/alchlang',status:'candidate',bin:{alchlang:'dist/core-cli.js'},
    exports:{'.':{types:'./dist/index.d.ts',import:'./dist/index.js'},'./package.json':'./package.json'},
    omit:[...rustModules,...localHostModules,'rust-cli','local-host-cli'],omitTemplates:true,
    assets:['APPLICATION.md','CLEAN-CONSUMER.md','PACKAGE-BOUNDARIES.md','docs/BEHAVIORAL-QUALIFICATION.md','docs/COMPILATION-RECONCILIATION.md','docs/FORMAL-CLAIMS.md','docs/LANGUAGE.md','docs/TUTORIAL.md',
      'examples/application-v1','examples/backend-types.alch','examples/domainspec-order.alch','examples/domainspec-order.alch.domainspec.json','examples/typed-backend.alch']},
  {id:'rust',name:'@cyberalchemy/alchlang-rust',status:'candidate',bin:{'alchlang-rust':'dist/rust-cli.js'},
    exports:{'.':{types:'./dist/rust-function-builder.d.ts',import:'./dist/rust-function-builder.js'},'./conformance':{types:'./dist/conformance.d.ts',import:'./dist/conformance.js'},'./package.json':'./package.json'},
    omit:[...localHostModules,'core-cli','local-host-cli'],omitTemplates:false,
    assets:['docs/RUST-FUNCTIONS.md','examples/typed-backend.alch']},
  {id:'local-host',name:'@cyberalchemy/alchlang-local-host',status:'experimental-repository-bound',bin:{'alchlang-local-host':'dist/local-host-cli.js'},
    exports:{'.':{types:'./dist/local-host.d.ts',import:'./dist/local-host.js'},'./package.json':'./package.json'},
    omit:['core-cli','rust-cli'],omitTemplates:false,
    assets:['SERVICE.md','CUSTODY.md','OUTBOUND.md','STREAMS.md']},
];

const isOmitted=(relative,spec)=>{
  if(spec.omitTemplates&&relative.startsWith('dist/event-templates/'))return true;
  return spec.omit.some(name=>relative===`dist/${name}.js`||relative===`dist/${name}.d.ts`);
};

function expandDeclaredFiles(packageRoot,declared){
  const files=['package.json'];
  for(const item of declared){
    const absolute=path.join(packageRoot,item);
    if(!existsSync(absolute))throw Error(`PACKAGE_BOUNDARY_MISSING_DECLARED_FILE:${item}`);
    if(statSync(absolute).isDirectory())files.push(...walk(absolute,item));else files.push(posix(item));
  }
  return [...new Set(files)].sort();
}

export function materializePackageBoundaries(){
  const distRoot=path.join(root,'dist');
  if(!existsSync(path.join(distRoot,'index.js')))throw Error('PACKAGE_BOUNDARY_BUILD_REQUIRED');
  const distFiles=walk(distRoot,'dist');
  const packages=packageSpecs.map(spec=>{
    for(const asset of spec.assets)if(!existsSync(path.join(root,asset)))throw Error(`PACKAGE_BOUNDARY_MISSING_ASSET:${spec.id}:${asset}`);
    const assets=spec.assets.flatMap(asset=>statSync(path.join(root,asset)).isDirectory()?walk(path.join(root,asset),asset):[asset]);
    const files=['package.json','README.md',...distFiles.filter(file=>!isOmitted(file,spec)),...assets].sort();
    return {id:spec.id,name:spec.name,status:spec.status,bin:spec.bin,exports:spec.exports,
      files,allowlist_sha256:sha256(JSON.stringify(files)),omitted_modules:spec.omit,includes_cargo_templates:!spec.omitTemplates,
      checkout_only_imports_allowed:false};
  });
  const domainSpecRoot=path.join(repo,'craft/projects/domainspec-v2/impl/cli');
  const domainSpecManifestPath=path.join(domainSpecRoot,'package.json');
  const domainSpecBytes=readFileSync(domainSpecManifestPath);
  const domainSpec=JSON.parse(domainSpecBytes.toString('utf8'));
  const expandedFiles=expandDeclaredFiles(domainSpecRoot,domainSpec.files);
  return {schema_version:'alchlang.package-boundaries/v1-candidate',version:packageSource.version,authority_effect:'none',
    packages,domainspec_cli:{package_root:'craft/projects/domainspec-v2/impl/cli',package_json_sha256:sha256(domainSpecBytes),
      name:domainSpec.name,version:domainSpec.version,bin:domainSpec.bin,exports:domainSpec.exports,declared_files:domainSpec.files,
      expanded_files:expandedFiles,expanded_allowlist_sha256:sha256(JSON.stringify(expandedFiles))},
    exclusions:{development_residue:['src','test','scripts','node_modules','docs-app','package-artifacts','generated'],
      checkout_only_declaration_imports:[],publication:false,release:false,deployment:false,authority_effect:'none'}};
}

const serialized=value=>JSON.stringify(value,null,2)+'\n';
export function readPackageBoundaries(){return readJson(boundaryPath);}
export function validatePackageBoundaries(value){
  if(value?.schema_version!=='alchlang.package-boundaries/v1-candidate'||value.version!==packageSource.version||value.authority_effect!=='none')throw Error('PACKAGE_BOUNDARY_CONTRACT');
  if(JSON.stringify(value.packages?.map(item=>item.id))!==JSON.stringify(['core','rust','local-host']))throw Error('PACKAGE_BOUNDARY_PACKAGES');
  for(const item of value.packages){
    if(!Array.isArray(item.files)||item.files.length!==new Set(item.files).size||JSON.stringify(item.files)!==JSON.stringify([...item.files].sort()))throw Error(`PACKAGE_BOUNDARY_FILES:${item.id}`);
    if(sha256(JSON.stringify(item.files))!==item.allowlist_sha256||item.checkout_only_imports_allowed!==false)throw Error(`PACKAGE_BOUNDARY_ALLOWLIST:${item.id}`);
    for(const required of ['package.json','README.md',...Object.values(item.bin)])if(!item.files.includes(required))throw Error(`PACKAGE_BOUNDARY_REQUIRED_FILE:${item.id}:${required}`);
    for(const target of Object.values(item.exports).flatMap(entry=>typeof entry==='string'?[entry]:Object.values(entry))){
      const relative=target.replace(/^\.\//u,'');if(!item.files.includes(relative))throw Error(`PACKAGE_BOUNDARY_EXPORT_TARGET:${item.id}:${relative}`);
    }
    if(item.files.some(file=>/^(?:src|test|scripts|node_modules|docs-app|package-artifacts|generated)(?:\/|$)/u.test(file)))throw Error(`PACKAGE_BOUNDARY_DEVELOPMENT_RESIDUE:${item.id}`);
  }
  const domain=value.domainspec_cli;
  if(domain?.name!=='@domainspec-v2/cli'||domain.version!=='1.0.0'||!Array.isArray(domain.expanded_files)||
      domain.expanded_files.length!==new Set(domain.expanded_files).size||sha256(JSON.stringify(domain.expanded_files))!==domain.expanded_allowlist_sha256)throw Error('PACKAGE_BOUNDARY_DOMAINSPEC');
  if(value.exclusions?.publication!==false||value.exclusions?.release!==false||value.exclusions?.deployment!==false||value.exclusions?.authority_effect!=='none')throw Error('PACKAGE_BOUNDARY_EFFECT');
  return value;
}
export function checkPackageBoundaries(){
  if(!existsSync(boundaryPath))throw Error('PACKAGE_BOUNDARY_MANIFEST_MISSING');
  const expectedValue=validatePackageBoundaries(materializePackageBoundaries());
  const actualValue=validatePackageBoundaries(readPackageBoundaries());
  const expected=serialized(expectedValue),actual=serialized(actualValue);
  if(actual!==expected)throw Error('PACKAGE_BOUNDARY_DRIFT: run npm run package-boundaries:write and review the exact allowlist change');
  for(const file of walk(path.join(root,'dist'),'dist').filter(file=>file.endsWith('.d.ts'))){
    const bytes=readFileSync(path.join(root,file),'utf8');
    if(/from\s+["'][.]{2}\//u.test(bytes)||bytes.includes('craft/projects/')||bytes.includes('language/capabilities/'))throw Error(`PACKAGE_BOUNDARY_CHECKOUT_IMPORT:${file}`);
  }
  return JSON.parse(expected);
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--write'))writeFileSync(boundaryPath,serialized(materializePackageBoundaries()));
  else if(process.argv.includes('--check'))checkPackageBoundaries();
  else process.stdout.write(serialized(materializePackageBoundaries()));
}
