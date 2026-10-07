// Trusted preparation reproduction seal; no gold labels or fixed-source reads.
// Open Questions: ../../evidence/G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {frameReferences} from './audit-defects4j-trace-source-r1.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const root='/home/vlad_/are-benchmark-archive/defects4j-canonical-jxpath8-r1';
const projectionBytes=readFileSync(join(root,'buggy-java-only','RECEIPT.json'));
const projection=JSON.parse(projectionBytes);
const inspectionBytes=readFileSync(join(root,'FIDELITY-INSPECTION.json'));
const inspection=JSON.parse(inspectionBytes);
if(inspection.projection_receipt_sha256!==sha(projectionBytes))throw Error('projection binding drift');
for(const source of projection.sources){
  for(const prefix of ['buggy-java-only/corpus','trusted-preparation']){
    if(sha(readFileSync(join(root,prefix,source.path)))!==source.sha256)throw Error('source changed during reproduction');
  }
}
const logBytes=readFileSync(join(root,'TEST-REPRODUCTION.log'));
const log=logBytes.toString();
if(!/^Running ant \(compile.tests\)[^\n]* OK$/m.test(log)||!/^Running ant \(run.dev.tests\)[^\n]* OK$/m.test(log))throw Error('compile/test execution did not pass');
if(!/^Failing tests: 1$/m.test(log)||!/^  - org\.apache\.commons\.jxpath\.ri\.compiler\.CoreOperationTest::testNan$/m.test(log))throw Error('unexpected test result');
const failureBytes=readFileSync(join(root,'trusted-preparation','failing_tests'));
const actual=frameReferences(failureBytes.toString());
const retained=inspection.frames.map(x=>({frame:x.frame,reproduced:actual.some(a=>a.suffix===x.frame.suffix&&a.method===x.frame.method&&a.trace_line===x.frame.trace_line)}));
if(!retained.every(x=>x.reproduced))throw Error('retained failure frames not reproduced');
const receipt={schema:'are.canonical-jxpath8-reproduction/v1',case_id:inspection.case_id,
  status:'compiled and reproduced exact exposed triggering test and retained frames',
  fixture_inspection_sha256:sha(inspectionBytes),projection_receipt_sha256:sha(projectionBytes),source_tree_sha256:projection.source_tree_sha256,
  compile_tests:true,test_selector:'org.apache.commons.jxpath.ri.compiler.CoreOperationTest::testNan',failing_tests:1,retained_frames:retained,
  reproduction_log_sha256:sha(logBytes),failure_observation_sha256:sha(failureBytes),source_identities_unchanged:true,
  scope:'one already-exposed case; no fixed-version test, no GLM calls, no ranking score or superiority claim',
  open_questions_owner:'G01-DEFECTS4J-TRACE-SOURCE-AUDIT-R1.md'};
const bytes=JSON.stringify(receipt,null,2)+'\n';writeFileSync(join(root,'REPRODUCTION-RECEIPT.json'),bytes,{flag:'wx',mode:0o600});
console.log(JSON.stringify({case_id:receipt.case_id,compile_tests:true,failing_tests:1,retained_frames_reproduced:retained.length,receipt_sha256:sha(bytes)}));
