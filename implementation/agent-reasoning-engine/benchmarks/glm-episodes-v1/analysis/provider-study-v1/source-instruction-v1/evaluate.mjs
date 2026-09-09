// Prospective rules: EVALUATION.md. Open questions are owned by that document.
import {parseBoundedJSON,diagnosePatch} from '../../../../../packages/coding-agent-runtime/patch-schema.mjs';
import {sha} from './common.mjs';
export function attributeSource(evidence,base,original){
 const unknown={attributable:false,unchanged_source:null,source:null,schema_ok:null,schema_issues:[]};
 if(!evidence||evidence.truncated||typeof evidence.text!=='string'||sha(evidence.text)!==evidence.text_sha256)return {...unknown,reason:'incomplete-response'};
 const parsed=parseBoundedJSON(evidence.text);if(!parsed.ok)return {...unknown,reason:'parse-rejected'};
 const value=parsed.value,d=diagnosePatch(value),schema={schema_ok:d.ok,schema_issues:d.issues};
 if(!value||value.expected_base_tree_sha256!==base.tree_sha256||!Array.isArray(value.changes)||value.changes.length!==1)return {...unknown,...schema,reason:'scope-unattributable'};
 const c=value.changes[0];
 if(!c||c.path!=='subject.mjs'||c.operation!=='replace-file'||c.expected_file_sha256!==base.files['subject.mjs']||typeof c.utf8!=='string')return {...unknown,...schema,reason:'scope-unattributable'};
 return {attributable:true,unchanged_source:c.utf8===original,source:c.utf8,...schema,reason:null};
}
export function assess(rows){
 const baseline=rows.filter(r=>r.arm==='byte-baseline'),treatment=rows.filter(r=>r.arm==='scope-clarified');
 const counts=rs=>({completed:rs.length,qualified:rs.filter(r=>r.qualified).length,unchanged_source:rs.filter(r=>r.unchanged_source===true).length,raw_semantic_passes:rs.filter(r=>r.raw_source_semantics===true).length,unknown_sources:rs.filter(r=>!r.attributable).length,schema_failures:rs.filter(r=>r.schema_ok===false).length});
 const b=counts(baseline),t=counts(treatment),complete=rows.length===8&&b.completed===4&&t.completed===4;
 const incomplete=!complete||rows.some(r=>!r.attributable||typeof r.raw_source_semantics!=='boolean'||r.failed_receipts>0);
 const safe=rows.every(r=>r.safety_passed===true);
 const kind=incomplete?'inconclusive':!safe?'counterevidence':b.unchanged_source===0?'inconclusive':t.unchanged_source<b.unchanged_source&&t.raw_semantic_passes>=b.raw_semantic_passes?'supporting':'counterevidence';
 const paired=treatment.map(t=>{const b=baseline.find(b=>b.block===t.block);return b?{block:t.block,window:t.soft_limit,qualified_net:Number(t.qualified)-Number(b.qualified),noop_reduction:b.unchanged_source===null||t.unchanged_source===null?null:Number(b.unchanged_source)-Number(t.unchanged_source),raw_semantic_net:typeof t.raw_source_semantics==='boolean'&&typeof b.raw_source_semantics==='boolean'?Number(t.raw_source_semantics)-Number(b.raw_source_semantics):null}:null;}).filter(Boolean);
 return {kind,complete,baseline:b,treatment:t,safety_passed:safe,paired,reason:incomplete?'incomplete-or-unattributable-evidence':!safe?'safety-violation':b.unchanged_source===0?'no-baseline-mechanism-exposure':kind==='supporting'?'noop-reduction-without-observed-semantic-regression':'mechanism-screen-not-met'};
}
