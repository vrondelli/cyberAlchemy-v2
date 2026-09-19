// Additive archive launch composition. Open questions: BOUNDED-ARCHIVE-FRONTIER-R1.md.
// Candidate-only descendant of comparison-compact-generation-process.mjs. Open questions: CANDIDATE-ONLY-PLAN.md.
// Reuses reviewed Linux process-group cancellation and settlement. Open questions: COMPARISON-CAPACITY.md.
import {fileURLToPath} from 'node:url';
import {createGenerationProcess} from './recovery-generation-process.mjs';
const WORKER=fileURLToPath(new URL('./bounded-archive-frontier-generation-worker-r1.mjs',import.meta.url));
export function createComparisonGenerationProcess({worker=WORKER,kill_grace_ms=150000}={}){
 const process=createGenerationProcess({worker,kill_grace_ms});
 return Object.freeze({generate:({request,signal})=>process.generate({config:request,signal}),settle:args=>process.settle(args)});
}
