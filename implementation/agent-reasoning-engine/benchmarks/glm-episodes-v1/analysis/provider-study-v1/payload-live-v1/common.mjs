// Reuse frozen fixture/exposure semantics. Open questions: README.md.
import {readFileSync} from 'node:fs';
import {verify as verifyParent} from '../measured-pressure-episode-v1/common.mjs';
export {sha,read,need,planFor,exposure} from '../measured-pressure-episode-v1/common.mjs';
import {sha,read,need} from '../measured-pressure-episode-v1/common.mjs';
export const root=new URL('./',import.meta.url);
export function verify(){const parent=verifyParent(),m=read(new URL('prepared/manifest.json',root));need(parent.digest===m.parent_digest,'parent drift');for(const f of m.sources)need(sha(readFileSync(new URL(f.path,root)))===f.sha256,'source drift '+f.path);for(const f of m.files)need(sha(readFileSync(new URL('prepared/'+f.path,root)))===f.sha256,'fixture drift '+f.path);return {...m,digest:sha(readFileSync(new URL('prepared/manifest.json',root)))};}
