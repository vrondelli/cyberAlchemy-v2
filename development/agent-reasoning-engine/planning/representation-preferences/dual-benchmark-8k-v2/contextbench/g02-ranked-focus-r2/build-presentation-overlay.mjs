// Mechanical overlay that retains the previous static acquisition instruction.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=dirname(fileURLToPath(import.meta.url));
const base=resolve(here,'../g02-adjacent-test-closure-r1/representation.mjs');
const destination=resolve(here,'representation.mjs');
const sha=text=>createHash('sha256').update(text).digest('hex');
const source=readFileSync(base,'utf8');
if(sha(source)!=='cd147d08ed4151f8abd6eaca15012d73efa89fde43de8f1e2c2da1bfe4be2a83')throw Error('ranked-focus.presentation-source-drift');
const anchor='  return { messages: mapped, tools: tools.map(tool => descriptions[tool.function?.name]';
if(source.split(anchor).length!==2)throw Error('ranked-focus.presentation-anchor');
const addition=`  const hintMarker = 'Deterministic pinned-base source hints; hints are not evidence.';
  const originalSystem = messages[0]?.role === 'system' ? String(messages[0].content) : '';
  const hintStart = originalSystem.indexOf(hintMarker);
  if (hintStart >= 0) mapped.push({role:'user',content:originalSystem.slice(hintStart)});
`;
const candidate=source.replace(anchor,addition+anchor);
writeFileSync(destination,candidate,{flag:'wx',mode:0o600});
console.log(JSON.stringify({base_sha256:sha(source),candidate_sha256:sha(candidate),destination}));
