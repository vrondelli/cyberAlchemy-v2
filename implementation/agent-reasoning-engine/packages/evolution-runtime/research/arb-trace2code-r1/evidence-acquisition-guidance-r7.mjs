// Public task-independent acquisition policy, not hidden reasoning or evidence.
// Open Questions: evidence/G01-EVIDENCE-ACQUISITION-GUIDANCE-R7.json.
import {createHash} from 'node:crypto';

export const ACQUISITION_GUIDANCE_R7 = [
 'ARE EVIDENCE-GROUNDED ACQUISITION POLICY:',
 'Use the supplied failure to distinguish expected from observed behavior. A symptom or matching name is not proof of its cause.',
 'Within the existing action budget, prefer complete-source inspections that distinguish plausible explanations. Check whether the delivered implementation actually accounts for the failure before selecting its handle.',
 'When evidence conflicts with a candidate cause, inspect relevant available implementation rather than repeat the same unsupported guess. Catalog metadata and unresolved references are navigation aids, not proof of source behavior.',
 'Use only already available tools and confirmed delivered source. Missing or zero runtime evidence does not establish irrelevance. Do not assume unseen caller, callee or historical fix behavior.',
 'Stop when the available evidence supports selection or the existing reserve requires finalization. No fixed read count, extra review call or retry is required. Follow the unchanged terminal schema; do not emit a reasoning transcript or add explanation fields.'
].join('\n');
export const ACQUISITION_GUIDANCE_SHA256_R7 = createHash('sha256').update(ACQUISITION_GUIDANCE_R7).digest('hex');

// Native integration must apply this before request measurement/capture/dispatch.
// Never mutate a measured prompt or a provider receipt after the fact.
export function evidenceGuidedMessagesR7(messages, arm) {
 if (!['baseline','index'].includes(arm) || !Array.isArray(messages) || messages.length < 2 ||
     messages[0]?.role !== 'system' || typeof messages[0].content !== 'string' ||
     messages[1]?.role !== 'user' || typeof messages[1].content !== 'string') {
  throw Error('evidence-guidance-r7.input');
 }
 if (messages.some(m => typeof m.content === 'string' && m.content.includes('ARE EVIDENCE-GROUNDED ACQUISITION POLICY:'))) {
  throw Error('evidence-guidance-r7.duplicate-policy');
 }
 const copy = structuredClone(messages);
 if (arm === 'index') copy[0].content += '\n' + ACQUISITION_GUIDANCE_R7;
 return copy;
}
