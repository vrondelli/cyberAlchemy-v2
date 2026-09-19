// Bind post-hoc diagnostics to audited inputs. Open questions: RECOVERY-R1-PARTIAL-SCORE-PROTOCOL.md.
import {readFileSync,realpathSync} from 'node:fs';import {resolve} from 'node:path';import {createHash} from 'node:crypto';
const hash=b=>createHash('sha256').update(b).digest('hex');
export function verifyDiagnosticBindings({review,required_paths,root,prior_review_path}){
 const check=bindings=>{if(!Array.isArray(bindings)||!bindings.length)throw Error('diagnostic.bindings-required');const paths=new Set();for(const b of bindings){const p=resolve(root,b.path);if(paths.has(p)||realpathSync(p)!==p||hash(readFileSync(p))!==b.sha256)throw Error('diagnostic.binding-drift');paths.add(p);}return paths;};
 const paths=check(review.source_bindings);for(const p of [...required_paths,prior_review_path])if(!paths.has(resolve(root,p)))throw Error('diagnostic.required-binding-missing');
 const prior=JSON.parse(readFileSync(resolve(root,prior_review_path)));if(prior.result_integrity_approved!==true||prior.classification!=='inconclusive')throw Error('diagnostic.prior-review');
 const priorPaths=check(prior.source_bindings);
 return {verified:true,diagnostic_bindings:paths.size,prior_bindings:priorPaths.size};
}
