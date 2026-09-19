// Reuses reviewed Linux process-group cancellation and settlement. Open questions: COMPARISON-GENERATION-PROCESS.md.
import {fileURLToPath} from 'node:url';
import {createGenerationProcess} from './recovery-generation-process.mjs';
const WORKER=fileURLToPath(new URL('./comparison-generation-worker.mjs',import.meta.url));
export function createComparisonGenerationProcess({worker=WORKER,kill_grace_ms=150000}={}){
 const process=createGenerationProcess({worker,kill_grace_ms});
 return Object.freeze({generate:({request,signal})=>process.generate({config:request,signal}),settle:args=>process.settle(args)});
}
