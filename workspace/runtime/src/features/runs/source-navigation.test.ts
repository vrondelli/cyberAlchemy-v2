import {it,expect} from 'vitest';
import {sourceHref,sourceTarget,matchSource} from './source-navigation';
import {textSha256} from './source-context';
const source={kind:'project' as const,id:'project / & ?',revision:'snapshot7',selector:'meaning'};
it('round trips encoded source coordinates and run identity without exporting content',async()=>{
 const target={source,textSha256:await textSha256('selected'),runId:'local/run/1'};
 const href=sourceHref(target)!;expect(sourceTarget(href)).toEqual(target);expect(href).not.toContain('selected');
 expect(sourceHref({...target,source:{...source,kind:'essay'}})).toBeNull();
});
it('distinguishes matching, changed revision/text and missing source',async()=>{
 const target={source,textSha256:await textSha256('selected')};
 expect(await matchSource(target,source,'selected')).toBe('matching');
 expect(await matchSource(target,{...source,revision:'8'},'selected')).toBe('changed');
 expect(await matchSource(target,source,'changed')).toBe('changed');
 expect(await matchSource(target,null,null)).toBe('unavailable');
 expect(await matchSource(target,{...source,id:'other'},'selected')).toBe('unavailable');
});
it('rejects malformed or wrong-surface links',()=>{
 for(const hash of ['#/chat?origin=%','#/chat?origin=null','#/chat?origin='+encodeURIComponent(JSON.stringify({source,textSha256:'x'}))])expect(sourceTarget(hash)).toBeNull();
 expect(sourceTarget(sourceHref({source,textSha256:'a'.repeat(64)})!.replace('/collections/projects','/chat'))).toBeNull();
});

it('routes knowledge context back to the existing research ontology',()=>{
 const target={source:{kind:'knowledge' as const,id:'concept:authority-ceiling',revision:'sha256:'+ 'a'.repeat(64),selector:'record-context'},textSha256:'a'.repeat(64),runId:'run/1'};
 const href=sourceHref(target)!;expect(href).toMatch(/^#\/apps\/orchestrator\/ontologies\?origin=/);expect(sourceTarget(href)).toEqual(target);
 expect(sourceTarget(href.replace('/apps/orchestrator/ontologies','/ontology'))).toBeNull();
});
