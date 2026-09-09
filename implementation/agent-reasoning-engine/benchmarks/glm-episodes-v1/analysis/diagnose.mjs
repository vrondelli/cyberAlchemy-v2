// Offline projection only. Open questions: README.md#open-questions.
import {createInterface} from 'node:readline';
import {createHash} from 'node:crypto';
import {diagnosePatch,parseBoundedJSON} from '../../../packages/coding-agent-runtime/patch-schema.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
for await(const line of createInterface({input:process.stdin})) {
 const {id,text}=JSON.parse(line),d=diagnosePatch(text),p=parseBoundedJSON(text),v=p.ok?p.value:null;
 const changes=Array.isArray(v?.changes)?v.changes:[];
 console.log(JSON.stringify({id,ok:d.ok,issues:d.issues,truncated:d.truncated,
  top_level_keys:v&&typeof v==='object'&&!Array.isArray(v)?Object.keys(v).sort():[],
  source_hashes:changes.filter(c=>typeof c?.utf8==='string').map(c=>sha(c.utf8)),
  protected_fields_present:typeof v?.expected_base_tree_sha256==='string'&&changes.length===1&&changes.every(c=>c?.operation==='replace-file'&&typeof c.path==='string'&&typeof c.expected_file_sha256==='string'&&typeof c.utf8==='string')}));
}
