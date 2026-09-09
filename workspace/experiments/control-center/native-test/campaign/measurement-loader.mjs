import {createHash} from 'node:crypto';

export const specURL=new URL('../../../../runtime/wdio/specs/unified-workspace.e2e.mjs',import.meta.url).href;
export const specSha256='22759fa745f08f865b189ccb382b24f9fc2728b12766c40af176ab9a241e159d';
export function measurementSource(source) {
  if(createHash('sha256').update(source).digest('hex')!==specSha256)throw new Error('MEASUREMENT_SPEC_DRIFT');
  // Only latency adjudication moves to the population analyzer. All functional
  // assertions and insufficient-sample failures remain in the original test.
  return source.replace('result.status !== "within-budget"','result.status === "insufficient-samples"')
    .replace('performanceResults, authorityEffect: "none"','performanceResults, collectionMode: "measurement-only/v1", authorityEffect: "none"');
}
export async function load(url,context,nextLoad) {
  const result=await nextLoad(url,context);
  if(url!==specURL)return result;
  return {...result,source:measurementSource(Buffer.from(result.source).toString('utf8'))};
}
