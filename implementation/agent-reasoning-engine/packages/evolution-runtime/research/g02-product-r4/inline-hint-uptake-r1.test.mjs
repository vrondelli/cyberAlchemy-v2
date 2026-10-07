// Open Questions: evidence/G02-INLINE-TYPED-DISCOVERY-R2-RESULT.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {associateLaterReads} from './inline-hint-uptake-r1.mjs';
const h={first_confirmed_receipt:4,source_sha256:'s',candidates:[{id:'d',kind:'function',definition_start_line:20,definition_end_line:30,read_file_args:{path:'a.py',start_line:20,line_count:11}}]};
const r=(id,start_line,end_line,first_confirmed_receipt=5,path='a.py',source_sha256='s')=>({id,start_line,end_line,first_confirmed_receipt,path,source_sha256});
test('same-batch and earlier reads are not uptake',()=>assert.deepEqual(associateLaterReads(h,[r('earlier',20,30,3),r('same',20,30,4)]).candidates[0].overlaps_definition_read_ids,[]));
test('containing is not exact suggestion match',()=>{const c=associateLaterReads(h,[r('larger',20,40)]).candidates[0];assert.deepEqual(c.exact_suggested_range_read_ids,[]);assert.deepEqual(c.contains_full_definition_read_ids,['larger']);});
test('exact and partial overlap stay distinct',()=>{const c=associateLaterReads(h,[r('exact',20,30),r('partial',25,27)]).candidates[0];assert.deepEqual(c.exact_suggested_range_read_ids,['exact']);assert.deepEqual(c.contains_full_definition_read_ids,['exact']);assert.deepEqual(c.overlaps_definition_read_ids,['exact','partial']);});
test('other paths and revisions do not match',()=>assert.deepEqual(associateLaterReads(h,[r('path',20,30,5,'b.py'),r('sha',20,30,5,'a.py','different')]).candidates[0].overlaps_definition_read_ids,[]));
