// Preserve the pinned ranker while excluding tracked directories/submodules from its file index.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const [sourcePath,outputPath]=process.argv.slice(2);
if(!sourcePath||!outputPath)throw Error('g02-own-expansions-v2.arguments');
const source=readFileSync(sourcePath,'utf8');
const sha=value=>createHash('sha256').update(value).digest('hex');
if(sha(source)!=='e924fce63ef783781b8361e8225fb9bc71756005ad9d4e0d5af8b0ebf2939dbd')
  throw Error('g02-own-expansions-v2.source-drift');
const ownAnchor='expanded.push(...(EXPANSIONS[token] ?? []));';
const indexAnchor='try { size = statSync(join(root, path)).size; } catch { omittedFiles++; continue; }';
const primerAnchor="const primer = query(problem_statement.replace(/<!--[\\s\\S]*?-->/g, ' ').replace(/https?:\\/\\/\\S+/g, ' '));";
if(source.split(ownAnchor).length!==2||source.split(indexAnchor).length!==2||source.split(primerAnchor).length!==2)
  throw Error('g02-own-expansions-v2.anchor-drift');
const output=source.replace(ownAnchor,
  'expanded.push(...(Object.hasOwn(EXPANSIONS,token)?EXPANSIONS[token]:[]));')
  .replace(indexAnchor,
    'try { const stat = statSync(join(root, path)); if (!stat.isFile()) { omittedFiles++; continue; } size = stat.size; } catch { omittedFiles++; continue; }')
  .replace(primerAnchor,
    "const primerText = problem_statement.replace(/<!--[\\s\\S]*?-->/g, ' ').replace(/https?:\\/\\/\\S+/g, ' '); const primer = query(Buffer.from(primerText).subarray(0, 1024).toString('utf8').replace(/\\uFFFD$/,'').trim());");
writeFileSync(outputPath,output,{flag:'wx',mode:0o644});
console.log(JSON.stringify({source_sha256:sha(source),output_sha256:sha(output)}));
