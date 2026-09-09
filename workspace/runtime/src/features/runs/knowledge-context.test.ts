import {it,expect} from 'vitest';
import {knowledgeContextText,type KnowledgeRecord} from './knowledge-context';
import {encodeSourceContext,readSourceContext,textSha256} from './source-context';
const record:KnowledgeRecord={id:'concept:one',label:'One',kind:'concept',summary:'Selected definition.',status:'candidate',sourceRefs:[{source_id:'source',source_ref:'local/source.md',selector:'section'}]};
it('preserves one definition, status, declared references and claim ceiling',()=>{
 const value=JSON.parse(knowledgeContextText(record)!);
 expect(value.definition).toBe(record.summary);expect(value.status).toBe('candidate');expect(value.authority_effect).toBe('none');expect(value.source_refs[0].digest).toBeNull();expect(value.claim_ceiling).toContain('do not establish acceptance');
 expect(value).not.toHaveProperty('neighbors');expect(value).not.toHaveProperty('source_contents');
});
it('does not prepare persona, source-pointer, run or absent context',()=>{
 for(const kind of ['persona','source','research-run'])expect(knowledgeContextText({...record,kind})).toBeNull();
 expect(knowledgeContextText(null)).toBeNull();expect(knowledgeContextText({...record,summary:' '})).toBeNull();
});
it('binds definition and metadata changes to distinct revisions and valid source envelopes',async()=>{
 const text=knowledgeContextText(record)!,revision='sha256:'+await textSha256(text);
 for(const changed of [{...record,status:'reviewed'},{...record,summary:'Changed.'},{...record,sourceRefs:[{...record.sourceRefs[0],digest:'declared'}]}])expect('sha256:'+await textSha256(knowledgeContextText(changed)!)).not.toBe(revision);
 const envelope=await readSourceContext(await encodeSourceContext({kind:'knowledge',id:record.id,revision,selector:'record-context'},text));
 expect(envelope?.text).toBe(text);expect(envelope?.source.revision).toBe(revision);
});
