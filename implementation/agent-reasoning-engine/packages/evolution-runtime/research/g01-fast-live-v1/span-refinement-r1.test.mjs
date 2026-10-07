import test from 'node:test';
import assert from 'node:assert/strict';
import {refineSelectedSpans} from './span-refinement-r1.mjs';

const prediction = spans => ({instance_id:'exposed',repo_url:'https://example.invalid/repo.git',commit:'a'.repeat(40),
  traj_data:{pred_files:Object.keys(spans),pred_spans:spans,pred_steps:[{files:Object.keys(spans),spans}]}});

test('focuses a wide selected base span around rare task terms without adding lines or files',()=>{
  const lines=Array.from({length:184},(_,i)=>i===166?'func parseFileArg(fileArg string) (string,error) {':i===172?'if !isLineNumber(arr[1]) {':'unrelated implementation');
  lines[24]='func runBrowse() error {';
  lines[160]='return Browser.Browse(url)';
  lines[58]='`$ gh browse main.go:312 at line 312`';
  const original=prediction({'pkg/cmd/browse/browse.go':[{start:1,end:100},{start:100,end:184}]});
  const result=refineSelectedSpans({prediction:original,problemStatement:'feat #4248 Add support for line range browse\n\nAllow using a range of lines when browsing files.',sourceForPath:()=>lines.join('\n')+'\n'});
  const span=result.prediction.traj_data.pred_spans['pkg/cmd/browse/browse.go'][0];
  assert.equal(result.changes.length,1);
  assert.ok(span.start<=167 && span.end>=174);
  assert.equal(span.end-span.start+1,32);
  assert.deepEqual(result.prediction.traj_data.pred_files,original.traj_data.pred_files);
  assert.deepEqual(original.traj_data.pred_spans['pkg/cmd/browse/browse.go'],[{start:1,end:100},{start:100,end:184}]);
});

test('leaves short, disconnected, and unsupported selections unchanged',()=>{
  const source=()=>Array.from({length:200},()=>"unrelated implementation").join('\n')+'\n';
  for(const spans of [[{start:1,end:80}],[{start:1,end:70},{start:100,end:180}],[{start:1,end:180}]]){
    const original=prediction({'a.go':spans});
    const result=refineSelectedSpans({prediction:original,problemStatement:'Add support for line range browse',sourceForPath:source});
    assert.deepEqual(result.prediction,original);
    assert.deepEqual(result.changes,[]);
  }
});

test('rejects source lines shorter than the selected provenance range',()=>{
  assert.throws(()=>refineSelectedSpans({prediction:prediction({'a.go':[{start:1,end:180}]}),problemStatement:'line range browse',sourceForPath:()=>"one\n"}),/source-span-out-of-bounds/);
});
