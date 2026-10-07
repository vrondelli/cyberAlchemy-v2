// Synthetic names only, no private file contents or labels.
// Open Questions: evidence/G01-SOURCE-DIRECTORY-EXPOSURE-161.json.
import test from 'node:test';import assert from 'node:assert/strict';
import {directoryCaseId,collectDirectoryExposure,inspectArchiveDirectories} from './source-directory-exposure-r1.mjs';
test('canonical case identity strips only explicit known suffixes',()=>{
 for(const suffix of ['','-checkout','-baseline','-index'])assert.equal(directoryCaseId('Defects4J-JacksonDatabind-5'+suffix),'Defects4J-JacksonDatabind-5');
 for(const value of ['Defects4J-Unknown-5','Defects4J-Cli-05','Defects4J-Cli-0','Defects4J-Cli-5-backup','Defects4J-Cli-5/RESULT.json','Cli-5','Defects4J-Cli-5-index-extra'])assert.equal(directoryCaseId(value),null);
});
test('deduplicate cohorts/arms, ignore files/symlinks and never assert completeness or fresh supply',()=>{
 const a={name:'g01-a',entries:[{name:'Defects4J-Cli-5-baseline',kind:'directory'},{name:'Defects4J-Cli-5-index',kind:'directory'},{name:'Defects4J-Cli-6',kind:'file'},{name:'Defects4J-Cli-7',kind:'symlink'},{name:'Defects4J-Unknown-5',kind:'directory'}]};
 const b={name:'defects4j-b',entries:[{name:'Defects4J-Cli-5-checkout',kind:'directory'},{name:'Defects4J-Lang-6',kind:'directory'}]};
 const r=collectDirectoryExposure([a,b]);assert.deepEqual(r.case_ids,['Defects4J-Cli-5','Defects4J-Lang-6']);assert.equal(r.distinct_prepared_case_ids,2);
 assert.equal(r.complete_exposure_union,false);assert.equal(r.confirmation_selection_allowed,false);assert.equal(r.unexposed_count,null);assert.equal(r.contents_read,0);assert.equal(r.unresolved.length,1);
 assert.deepEqual(collectDirectoryExposure([b,{...a,entries:[...a.entries].reverse()}]),r);
});
test('malformed, duplicate or out-of-scope archive identities reject',()=>{
 for(const archives of [[{name:'unrelated',entries:[]}],[{name:'g01-a/b',entries:[]}],[{name:'g01-a',entries:[]},{name:'g01-a',entries:[]}],[{name:'g01-a',entries:[{name:'bad/name',kind:'directory'}]}]])assert.throws(()=>collectDirectoryExposure(archives));
 assert.throws(()=>inspectArchiveDirectories('/tmp'));assert.throws(()=>collectDirectoryExposure(null));
});
