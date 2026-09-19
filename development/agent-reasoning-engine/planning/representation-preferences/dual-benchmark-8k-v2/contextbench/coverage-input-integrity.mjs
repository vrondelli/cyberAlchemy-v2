// Open questions: RECOVERY-R1-COVERAGE-PROTOCOL.md.
import {readFileSync,realpathSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
export function bindCoverageInputs(paths){return [...new Set(paths.map(p=>resolve(p)))].sort().map(path=>{if(realpathSync(path)!==path)throw Error('coverage-input.alias');return {path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')};});}
export function verifyCoverageInputs(bindings){for(const b of bindings){const [now]=bindCoverageInputs([b.path]);if(now.sha256!==b.sha256)throw Error('coverage-input.drift');}return true;}
