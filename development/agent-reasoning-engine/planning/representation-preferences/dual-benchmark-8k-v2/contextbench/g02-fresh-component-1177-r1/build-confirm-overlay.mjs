// Exact source-only task binding for a pinned fresh Flipt issue.
import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('fresh-confirm.arguments');
const sha=value=>createHash('sha256').update(value).digest('hex');
let source=readFileSync(input,'utf8');
if(sha(source)!=='0688be71c6e237ce8acdc039ddc22db818f4023b12aac0f82512601a09b37d1e')throw Error('fresh-confirm.input-drift');
const replacements=[
  ['SWE-Bench-Pro__go__maintenance__bugfix__05aad678','SWE-Bench-Pro__go__maintenance__bugfix__1177cd53'],
  ['1d5fef530d00c572f867f15e35be4e03e6ee39757fa287747fbe3483a2835683','9846ff1e35cc0d779541d090bde1c3bc1073f606d02a0077a5a959f37e8d046b'],
  ['b22f5f02e40b225b6b93fff472914973422e97c6','165ba79a44732208147f516fa6fa4d1dc72b7008'],
  ['g02-normalized-clauses-16-go-confirm-r1','g02-fresh-component-1177-r1']
];
for(const [before,after] of replacements){
  if(source.split(before).length<2)throw Error('fresh-confirm.anchor-missing:'+before);
  source=source.replaceAll(before,after);
}
writeFileSync(output,source,{flag:'wx',mode:0o644});
console.log(JSON.stringify({overlay_sha256:sha(source)}));
