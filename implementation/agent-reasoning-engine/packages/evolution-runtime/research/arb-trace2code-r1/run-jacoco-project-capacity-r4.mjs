// Deterministic whole16 availability pilot; not a model or quality campaign.
// Open Questions: evidence/G01-JACOCO-PROJECT-CAPACITY-R4.json.
import{readFileSync,writeFileSync,mkdirSync,existsSync}from'node:fs';import{join,dirname,resolve}from'node:path';import{fileURLToPath}from'node:url';import{createHash}from'node:crypto';import{spawn,execFileSync}from'node:child_process';
const here=dirname(fileURLToPath(import.meta.url)),repo=resolve(here,'../../../../../..'),root='/home/vlad_/are-benchmark-archive/g01-jacoco-project-capacity-r4-20261006',framework='/home/vlad_/are-benchmark-archive/defects4j-runtime-v3.0.1';
const sha=b=>createHash('sha256').update(b).digest('hex'),need=(v,r)=>{if(!v)throw Error('coverage-controller.'+r);},save=(n,x)=>writeFileSync(join(root,n),JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
need(!existsSync(root),'no-overwrite');const inputBytes=readFileSync('/home/vlad_/are-benchmark-archive/defects4j-canonical-exposed-r1/FIXTURES.json');need(sha(inputBytes)==='bd8e039287f3e9b2f18454d476973066407a465e3bd7e00c4c8a3c29fe4c05a6','fixtures-pin');
const input=JSON.parse(inputBytes);need(input.complete===62&&input.failed===0,'all62-source');const projects=new Set(),cases=[];
for(const c of input.cases){if(projects.has(c.project))continue;projects.add(c.project);const selectors=[...c.trace.matchAll(/^--- (.+)$/gm)].map(m=>m[1]);need(selectors.length===1&&/^[A-Za-z_$][\w.$]*::[A-Za-z_$][\w$]*$/.test(selectors[0]),'test-selector');
 cases.push({case_id:c.case_id,project:c.project,bug:c.bug,source_tree_sha256:c.source_tree_sha256,source_count:c.source_count,projection_receipt_sha256:c.projection_receipt_sha256,
  test_selector:selectors[0],expected_failure_type:c.trace.split('\n')[1].split(':')[0].trim(),trace_sha256:sha(c.trace)});
}need(cases.length===16,'all16-projects');need(execFileSync('git',['-C',framework,'rev-parse','HEAD'],{encoding:'utf8'}).trim()===input.framework_pin,'framework-pin');
const toolBytes=readFileSync('/home/vlad_/.local/share/are-toolchains/jacoco-0.8.12/RECEIPT.json'),tools=JSON.parse(toolBytes);
need(tools.version==='0.8.12','tool-version');for(const e of tools.entries)need(sha(readFileSync('/home/vlad_/.local/share/are-toolchains/jacoco-0.8.12/'+e.name))===e.sha256,'tools');
mkdirSync(root,{mode:0o700});
const names=['run-jacoco-project-capacity-r4.mjs','run-jacoco-capacity-case-r4.mjs','all-production-instrumentation-r2.mjs','java-type-links-dev-r1.mjs','project-canonical-buggy-fixture-r1.mjs','jacoco-class-binding-r3b.mjs','bind-jacoco-r3b.py','audit-jacoco-project-capacity-r4.py'];
const freeze={status:'all16-frozen-before-execution',input_fixtures_sha256:sha(inputBytes),cases,framework_pin:input.framework_pin,tools,tool_receipt_sha256:sha(toolBytes),
 source_sha256:Object.fromEntries(names.map(n=>[n,sha(readFileSync(join(here,n)))])),
 framework_source_sha256:Object.fromEntries(['framework/bin/d4j/d4j-test','framework/bin/d4j/d4j-compile','framework/bin/d4j/d4j-export','framework/core/Project.pm','framework/projects/defects4j.build.xml','framework/projects/Mockito/Mockito.build.xml',...cases.map(c=>'framework/core/Project/'+c.project+'.pm')].map(n=>[n,sha(readFileSync(join(framework,n)))])),
 launcher_sha256:sha(readFileSync(join(repo,'tools/toolchain/run-defects4j'))),protocol_sha256:sha(readFileSync(join(here,'../../evidence/G01-JACOCO-PROJECT-CAPACITY-R4.json'))),
 limits:{parallel_cases:2,timeout_per_operation_ms:300000,ant_heap_mb:1536,minimum_wsl_free_bytes:8*1024**3,automatic_retries:0},
 capacity_gate:{all16_terminal:true,source_bound_failure_reproductions_at_least:15},
 selection:'First case per project in existing exposed canonical fixture source order, before execution. No replacements or source/quality-selected omissions.',
 authority_effect:'none',claim_ceiling:'Availability/source-binding only; no provider, quality labels, ranking or superiority.',open_questions_owner:'G01-JACOCO-PROJECT-CAPACITY-R4.json'};
save('FREEZE.json',freeze);const rows=[];let cursor=0;
async function worker(){while(cursor<cases.length){const c=cases[cursor++];const code=await new Promise((res,rej)=>{const child=spawn(process.execPath,[join(here,'run-jacoco-capacity-case-r4.mjs'),c.case_id],{stdio:['ignore','inherit','inherit'],env:{PATH:'/usr/bin:/bin'}});child.on('error',rej);child.on('close',res);});
 const resultPath=join(root,c.case_id,'RESULT.json'),bytes=existsSync(resultPath)?readFileSync(resultPath):null;
 const row={case_id:c.case_id,exit_code:code,result_sha256:bytes?sha(bytes):null,status:bytes?JSON.parse(bytes).status:'missing-terminal-result'};rows.push(row);
 writeFileSync(join(root,'STATUS.json'),JSON.stringify({finished:rows.length,expected:16,last:row},null,2)+'\n',{mode:0o600});console.log(JSON.stringify({finished:rows.length,expected:16,...row}));
}}
await Promise.all([worker(),worker()]);rows.sort((a,b)=>cases.findIndex(c=>c.case_id===a.case_id)-cases.findIndex(c=>c.case_id===b.case_id));
save('CAMPAIGN-TERMINAL.json',{status:'all16-terminal-before-binding-audit',rows,freeze_sha256:sha(readFileSync(join(root,'FREEZE.json'))),provider_calls:0,reference_label_reads:0,authority_effect:'none'});
console.log(JSON.stringify({status:'all16-terminal-before-binding-audit',execution_complete:rows.filter(r=>r.status==='terminal-jacoco-execution-complete').length,expected:16}));
