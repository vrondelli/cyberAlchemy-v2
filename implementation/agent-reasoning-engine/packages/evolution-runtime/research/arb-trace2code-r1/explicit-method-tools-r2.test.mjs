// Synthetic plus read-only frozen real source views; zero providers/labels.
// Open Questions: evidence/G01-NATIVE-METHOD-INTERFACE-DIAGNOSIS-R2.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createExplicitMethodTools,explicitMethodToolSchemas,FINAL_RAW_JSON_GUIDANCE} from './explicit-method-tools-r2.mjs';
import {createMethodEpisodeTools} from './native-method-episode-r1.mjs';
import {createFrozenAdaptiveCommonTools} from './adaptive-common-tools-r1.mjs';
test('operation-specific schemas no longer advertise rejected cross-operation fields',()=>{
 const tools=new Map(explicitMethodToolSchemas().map(t=>[t.function.name,t.function.parameters]));
 assert.equal(tools.size,7);assert.deepEqual(Object.keys(tools.get('runtime_status').properties),[]);
 assert.equal(tools.get('list_files').properties.path,undefined);
 assert.equal(tools.get('list_methods').properties.class_name,undefined);
 assert.deepEqual(tools.get('list_methods').required,['path']);
 assert.ok(FINAL_RAW_JSON_GUIDANCE.includes('No prose before/after'));
 for(const schema of tools.values()){assert.equal(schema.additionalProperties,false);assert.equal(schema.properties.case_id,undefined);}
});
test('new interface delegates identical valid evidence requests to frozen backend',async()=>{
 const view=createFrozenAdaptiveCommonTools(),old=createMethodEpisodeTools({caseId:'Defects4J-Cli-5',view}),
  next=createExplicitMethodTools({caseId:'Defects4J-Cli-5',view});
 const requests=[['runtime_status',{}],['list_runtime_methods',{class_name:'org.apache.commons.cli.Util',positive_only:true,limit:3}],
  ['list_files',{limit:3}],['list_methods',{path:'src/java/org/apache/commons/cli/Util.java',name:'stripLeadingHyphens'}],
  ['list_references',{path:'src/java/org/apache/commons/cli/Util.java',limit:3}]];
 for(const[name,args]of requests)assert.deepEqual(await next.execute_tool(name,args),await old.execute_tool('method_navigation',{...args,operation:name}));
 const catalog=await next.execute_tool('list_methods',{path:'src/java/org/apache/commons/cli/Util.java',name:'stripLeadingHyphens'});
 const method=catalog.output.items[0],args={method_id:method.method_id,path:'src/java/org/apache/commons/cli/Util.java',start_line:method.source_span.start_line};
 assert.deepEqual(await next.execute_tool('read_file',args),await old.execute_tool('read_file',args));
});
test('wrong fields, caller case injection, invented IDs and coordinates still reject and consume attempts',async()=>{
 const next=createExplicitMethodTools({caseId:'Defects4J-Cli-5'});
 await assert.rejects(next.execute_tool('runtime_status',{class_name:'x'}));
 await assert.rejects(next.execute_tool('list_files',{path:'src'}));
 await assert.rejects(next.execute_tool('list_methods',{path:'src/A.java',class_name:'A'}));
 await assert.rejects(next.execute_tool('runtime_status',{case_id:'other'}));
 await assert.rejects(next.execute_tool('runtime_status',{operation:'list_files'}));
 const invalid=await next.execute_tool('read_file',{method_id:'invented',path:'src/A.java',start_line:1});
 assert.equal(invalid.ok,false);assert.equal(invalid.output,undefined);assert.equal(next.snapshot().attempts,6);
});
test('all16 actual source cases retain identical runtime availability, catalog and complete-method outcomes',async()=>{
 const cases=JSON.parse(readFileSync('/home/vlad_/are-benchmark-archive/g01-canonical-method-index-r1-20261007/RESULT.json')).rows;
 assert.equal(cases.length,16);const view=createFrozenAdaptiveCommonTools();
 for(const c of cases){
  const old=createMethodEpisodeTools({caseId:c.case_id,view}),next=createExplicitMethodTools({caseId:c.case_id,view});
  async function compare(name,args){const a=await next.execute_tool(name,args),b=await old.execute_tool('method_navigation',{...args,operation:name});assert.deepEqual(a,b,c.case_id+':'+name);return a;}
  const status=await compare('runtime_status',{});assert.equal(status.ok,true);
  if(c.case_id==='Defects4J-Closure-5')assert.equal(status.output.runtime_available,false);
  await compare('list_runtime_methods',{positive_only:true,limit:3});
  const files=await compare('list_files',{limit:50}),file=files.output.items.find(f=>f.methods>0);assert.ok(file);
  // First catalog declaration may be bodyless (interfaces). Keep it rather than
  // cherry-picking a different file; both adapters must preserve its exact outcome.
  const methods=await compare('list_methods',{path:file.path,limit:50}),method=methods.output.items[0];assert.ok(method,c.case_id);
  await compare('list_references',{path:file.path,method_id:method.method_id,limit:3});
  const args={method_id:method.method_id,path:file.path,start_line:method.source_span.start_line};
  assert.deepEqual(await next.execute_tool('read_file',args),await old.execute_tool('read_file',args));
 }
});
