import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {compileCarrier,parseDomainSource} from '../../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/index.ts';
import {buildMintedProjectViews} from '../../../../../../projects/domainspec-v2/impl/tools/minted-project/views';
const root=new URL('./',import.meta.url);
const compiler=new URL('../../../../../language/capabilities/alchlang/plans/general-compiler-v1/implementation/',root);
const hash=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
const bytes=(value:unknown)=>JSON.stringify(value,null,2)+'\n';
const source=readFileSync(new URL('exchange-model.alch',root),'utf8');
const one=compileCarrier(parseDomainSource(source).carrier);
const two=compileCarrier(parseDomainSource(source).carrier);
if(bytes(one)!==bytes(two))throw new Error('non-deterministic model compilation');
const dependencies=Object.fromEntries(readdirSync(new URL('src/',compiler)).filter(n=>n.endsWith('.ts')).sort().map(n=>['src/'+n,hash(readFileSync(new URL('src/'+n,compiler)))]));
const result={status:'compiled-prototype',authority_effect:'none',source_sha256:hash(source),compiler_sources:dependencies,
 compiler_package_sha256:hash(readFileSync(new URL('package.json',compiler))),builder_sha256:hash(readFileSync(new URL('build.ts',root))),
 deterministic_runs:2,host_runtime:'ARE scripted fixture turns',kep_transport:'local KEP crypto adapter and state kernel',compilation:one};
const options={developmentProfileRegistry:{path:fileURLToPath(new URL('domainspec/development-profile.json',root)),handle:'kep-alchlang-agent-exchange-development-v0.1'}};
const first=buildMintedProjectViews(fileURLToPath(new URL('domainspec/',root)),options);
const second=buildMintedProjectViews(fileURLToPath(new URL('domainspec/',root)),options);
for(const key of ['graphBytes','sourceManifestBytes','markdownBytes','markdownViewBytes','buildReceiptBytes'] as const)if(first[key]!==second[key])throw new Error('non-deterministic DomainSpec '+key);
const system={schema_version:'kep-alchlang-agent-exchange-system-prototype/v1',authority_effect:'none',registered:false,
 source_graph_sha256:hash(first.graphBytes),prototype_sha256:hash(readFileSync(new URL('prototype.json',root))),
 alchlang_model_sha256:hash(source),nodes:first.graph.nodes,edges:first.graph.edges,
 implementation:Object.fromEntries(['simulate.ts','simulate.py','exchange.ts','are-host.ts','kep-transport.ts','demo.ts','bridge/Cargo.toml','bridge/Cargo.lock','bridge/src/main.rs'].map(p=>[p,hash(readFileSync(new URL(p,root)))]))};
const artifacts={'model.json':bytes(result),'graph.json':first.graphBytes,'source-manifest.json':first.sourceManifestBytes,
 'SPEC.md':first.markdownBytes,'markdown-view.json':first.markdownViewBytes,'build-receipt.json':first.buildReceiptBytes,
 'system-ontology.json':bytes(system)};
if(process.argv.includes('--emit-json'))process.stdout.write(bytes(artifacts));
else {mkdirSync(new URL('generated/',root),{recursive:true});for(const [name,content]of Object.entries(artifacts))writeFileSync(new URL('generated/'+name,root),content);process.stdout.write('built='+Object.keys(artifacts).length+'\n');}
