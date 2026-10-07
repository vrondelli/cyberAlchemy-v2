// Development-only candidate. Never rewrites the frozen G02 r3 helper.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";

const [basePath, outputPath] = process.argv.slice(2);
if (!basePath || !outputPath) throw Error("usage: build-python-hints-r1.mjs BASE_HELPER NEW_HELPER");
let source = readFileSync(basePath, "utf8");
const sha = text => createHash("sha256").update(text).digest("hex");
const before = "  const order=new Map(categories.map(([name],index)=>[name,index]));";
if (source.split(before).length !== 2 || !source.includes("  const tracked=execFileSync('git'")) throw Error("g02-python-hints.source-shape-drift");
const python = `  // Source-only Python relationship expansion. The same general rule applies to
  // every Python repository; neither task IDs nor native labels are consulted.
  if(!goProject&&(tracked.includes('pyproject.toml')||tracked.includes('setup.py'))){
    const pythonExisting=existingPaths.filter(path=>path.endsWith('.py')&&/^[a-zA-Z0-9_./-]+$/.test(path)&&!path.includes('..'));
    const bases=pythonExisting.map(path=>path.split('/').at(-1).replace(/\\.py$/,'').replace(/^test_/,'').replace(/_test$/,'')).filter(Boolean);
    for(const path of tracked){
      if(!path.endsWith('.py')||existing.has(path)||!(/^[a-zA-Z0-9_./-]+$/.test(path))||path.includes('..'))continue;
      let stat;try{stat=lstatSync(join(base,path));}catch{continue;}
      if(!stat.isFile()||stat.size>256*1024)continue;
      const lines=readFileSync(join(base,path),'utf8').split(/\\r?\\n/),lower=lines.join('\\n').toLowerCase();
      const pathLower=path.toLowerCase(),pathTokens=pathLower.split(/[^a-z0-9]+/);
      const pathAnchors=anchors.filter(anchor=>pathTokens.some(token=>token.startsWith(anchor.slice(0,Math.min(anchor.length,6)))));
      const sourceAnchors=anchors.filter(anchor=>lower.includes(anchor));
      const sameDirectory=pythonExisting.some(existingPath=>existingPath.slice(0,existingPath.lastIndexOf('/')+1)===path.slice(0,path.lastIndexOf('/')+1));
      const relatedBase=bases.find(stem=>stem.length>=4&&(pathLower.includes(stem.toLowerCase())||lower.includes(stem.toLowerCase())))??null;
      if(!pathAnchors.length&&!relatedBase&&!(sameDirectory&&sourceAnchors.length>=2))continue;
      const role=/(?:^|\\/)tests?(?:\\/|$)|(?:^|\\/)test_/.test(path)?'test':
        /(?:^|\\/)(?:api|routes?|handlers?)(?:\\/|$)/.test(path)?'api':
        /(?:^|\\/)(?:utils?|helpers?)(?:\\/|$)/.test(path)?'utility':'module';
      const first=lines.findIndex(line=>pathAnchors.some(anchor=>line.toLowerCase().includes(anchor))||
        (relatedBase&&line.toLowerCase().includes(relatedBase.toLowerCase())));
      const position=Math.max(0,first),score=40+12*pathAnchors.length+3*sourceAnchors.length+
        (relatedBase?24:0)+(sameDirectory?15:0)+(role==='test'?5:0);
      candidates.push({path,kind:'cross-layer',layer:'python-'+role,
        start_line:Math.max(1,position-14),end_line:Math.min(lines.length,position+55),
        matched_terms:relatedBase?[relatedBase,...pathAnchors]:pathAnchors.length?pathAnchors:sourceAnchors,
        score_units:score});
    }
  }
`;
source = source.replace(before, python + before);
writeFileSync(outputPath, source, {flag: "wx", mode: 0o600});
process.stdout.write(`${JSON.stringify({base_sha256: sha(readFileSync(basePath)), candidate_sha256: sha(source), output: outputPath})}\n`);
