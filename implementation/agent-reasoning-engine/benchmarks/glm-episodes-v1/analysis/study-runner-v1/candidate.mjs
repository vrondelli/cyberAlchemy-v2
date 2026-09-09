// Isolated source-bound compilation; never changes the serving module. Open questions: README.md#open-questions.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const upstream=new URL('../../../../packages/coding-agent-runtime/glm-flash-v1/agent.mjs',import.meta.url);
const sha=x=>createHash('sha256').update(x).digest('hex');
export function compileCandidate(output){
 const original=readFileSync(upstream,'utf8');let source=original;
 const patch=(from,to)=>{if(source.split(from).length!==2)throw Error('candidate patch anchor drift: '+from);source=source.replace(from,to);};
 patch('      const prompt=stable({tools:', '      let prompt=stable({tools:');
 patch('      if(boundedDelivery)rememberDeliveryProjection(deliveryProjections,prompt,history,retained);',
       '      prompt=input.study_adapter.decorate(prompt);\n      if(boundedDelivery)rememberDeliveryProjection(deliveryProjections,prompt,history,retained);');
 patch('parseSubmission(message,finish_reason,{base,mutation_allowlist:input.mutation_allowlist})',
       'parseSubmission(input.study_adapter.normalize(message,base,input.mutation_allowlist),finish_reason,{base,mutation_allowlist:input.mutation_allowlist})');
 patch('source_binding: sourceBinding,','source_binding: hash({upstream:sourceBinding,study:input.study_adapter.binding}),');
 source=source.replace(/from (['"])(\.[^'"]+)\1/g,(_,q,p)=>'from '+JSON.stringify(new URL(p,upstream).href));
 source=source.replaceAll('import.meta.url',JSON.stringify(upstream.href));
 writeFileSync(output,source,{flag:'wx'});
 return {upstream_sha256:sha(original),candidate_sha256:sha(source),compiler_sha256:sha(readFileSync(new URL('candidate.mjs',import.meta.url))),authority_effect:'none'};
}
