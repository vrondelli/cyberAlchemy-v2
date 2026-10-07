// Mechanical new-code-version derivation from the already frozen 24-task cohort.
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

const [sourcePath,destination]=process.argv.slice(2);
if(!sourcePath||!destination)throw Error('g02-replication-r2.arguments');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const bytes=readFileSync(resolve(sourcePath));
if(sha(bytes)!=='387ab42f5fd948d5683dcc87d42242bd9200e879f58eb54f1d5db622fd2d89f0')
  throw Error('g02-replication-r2.source-plan-drift');
const prior=JSON.parse(bytes);
if(prior.ordered_pairs.length!==24||prior.cohort_sha256!=='f1082f881ae26be2aa4a302353252e97b796c74a04ea588c4dc69518bb1e8452')
  throw Error('g02-replication-r2.cohort-drift');
const next={...prior,status:'pre-dispatch-new-code-version',
  tools_root:'/opt/are/evolution-runtime/g02-product-replication-tools-r2',
  prior_execution_plan_sha256:sha(bytes),
  candidate_patch:{name:'tracked-regular-files-only-and-bounded-primer',
    builder_sha256:sha(readFileSync(new URL('./build-own-expansions-base-v2.mjs',import.meta.url))),
    source_only_preflight:'Go navidrome pinned base index built successfully: 601 indexed, 34 omitted, zero model calls',
    rationale:'The r1 Go task failed before ARE model dispatch on a tracked directory; source-only preflight also exposed a >1024-byte primer.'},
  ordered_pairs:prior.ordered_pairs.map(pair=>{
    const suffix=pair.suffix.replace(/^pr1-/,'pr2-');
    if(suffix===pair.suffix)throw Error('g02-replication-r2.suffix-drift');
    return {...pair,suffix,root:'/opt/are-benchmark-runs/g02-cross-layer-'+suffix};
  })};
const target=resolve(destination);
mkdirSync(dirname(target),{recursive:true,mode:0o700});
writeFileSync(target,JSON.stringify(next,null,2)+'\n',{flag:'wx',mode:0o600});
console.log(JSON.stringify({path:target,sha256:sha(readFileSync(target)),pairs:next.ordered_pairs.length}));
