// Exact original auditor with qualified common-contract wording only.
// Open Questions: evidence/G01-NATIVE-CONTRACT-SUFFICIENCY-R10.json.
import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
import {clarifySelectionContract} from './native-method-contract-r10.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const freezePath='/home/vlad_/are-benchmark-archive/g01-native-method-live-r9-20261007/FREEZE.json';
const raw=readFileSync(freezePath);assert.equal(sha(raw),'f4120d0a132fc7f0ec8ebe1b719e4e4198c10ec133a2a7a60f3ea5a80bc74dda');
const pins=JSON.parse(raw).source_pins,path=fileURLToPath(new URL('./audit-acquisition-guidance-r7.mjs',import.meta.url)),base=readFileSync(path);
assert.equal(sha(base),pins[path]);
const imported=new URL('./evidence-acquisition-guidance-r7.mjs',import.meta.url);
assert.equal(sha(readFileSync(imported)),pins[fileURLToPath(imported)]);
const projected=clarifySelectionContract(base.toString('utf8'));
const before="'./evidence-acquisition-guidance-r7.mjs'",after=JSON.stringify(imported.href);
assert.equal(projected.split(before).length,2);const effective=projected.replace(before,after);
const module=await import('data:text/javascript;base64,'+Buffer.from(effective).toString('base64'));
export const checkAcquisitionGuidanceRequestR10=module.checkAcquisitionGuidanceRequestR7;
export const commonContractAuditBindingR10={original_source_path:path,original_sha256:sha(base),effective_sha256:sha(effective),delta:'Exact shared public wording clarification and required file import relocation only; original task/arm/guidance assertions retained.',authority_effect:'none'};
