// Source-only Python import and issue-term refinement after r1 falsification.
import {createHash} from "node:crypto";
import {readFileSync, writeFileSync} from "node:fs";

const [basePath, outputPath] = process.argv.slice(2);
if (!basePath || !outputPath) throw Error("usage: build-python-hints-r2.mjs R1_HELPER NEW_HELPER");
let source = readFileSync(basePath, "utf8");
function replace(before, after) {
  if (source.split(before).length !== 2) throw Error(`g02-python-hints-r2.source-shape-drift:${before.slice(0, 50)}`);
  source = source.replace(before, after);
}
replace(
  "    const bases=pythonExisting.map(path=>path.split('/').at(-1).replace(/\\.py$/,'').replace(/^test_/,'').replace(/_test$/,'')).filter(Boolean);",
  `    const bases=pythonExisting.map(path=>path.split('/').at(-1).replace(/\\.py$/,'').replace(/^test_/,'').replace(/_test$/,'')).filter(Boolean);
    const pythonAnchors=[...new Set((issue.slice(0,1500).toLowerCase().match(/[a-z]{4,}/g)??[])
      .filter(token=>!genericStopwords.has(token)))].slice(0,40);
    const imported=new Set();
    for(const selected of pythonExisting){
      let content;try{content=readFileSync(join(base,selected),'utf8').slice(0,12000);}catch{continue;}
      for(const match of content.matchAll(/^from\\s+([a-zA-Z_][a-zA-Z0-9_.]*)\\s+import\\s+([^\\n]+)/gm)){
        const prefix=match[1].replaceAll('.','/');
        if(tracked.includes(prefix+'.py'))imported.add(prefix+'.py');
        for(const name of match[2].split(',').map(value=>value.trim()).filter(value=>/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value))){
          const target=prefix+'/'+name+'.py';if(tracked.includes(target))imported.add(target);
        }
      }
      for(const match of content.matchAll(/^import\\s+([a-zA-Z_][a-zA-Z0-9_.]*)/gm)){
        const target=match[1].replaceAll('.','/')+'.py';if(tracked.includes(target))imported.add(target);
      }
    }`
);
replace("const pathAnchors=anchors.filter(anchor=>pathTokens.some(token=>token.startsWith(anchor.slice(0,Math.min(anchor.length,6)))));",
  "const pathAnchors=pythonAnchors.filter(anchor=>pathTokens.some(token=>token.startsWith(anchor.slice(0,Math.min(anchor.length,6)))));");
replace("const sourceAnchors=anchors.filter(anchor=>lower.includes(anchor));",
  "const sourceAnchors=pythonAnchors.filter(anchor=>lower.includes(anchor));");
replace("if(!pathAnchors.length&&!relatedBase&&!(sameDirectory&&sourceAnchors.length>=2))continue;",
  "const directlyImported=imported.has(path);\n      if(!pathAnchors.length&&!relatedBase&&!directlyImported&&!(sameDirectory&&sourceAnchors.length>=2))continue;");
replace("const role=/(?:^|\\/)tests?(?:\\/|$)|(?:^|\\/)test_/",
  "const role=directlyImported?'import':/(?:^|\\/)tests?(?:\\/|$)|(?:^|\\/)test_/");
replace("(relatedBase?24:0)+(sameDirectory?15:0)+(role==='test'?5:0);",
  "(relatedBase?24:0)+(sameDirectory?15:0)+(directlyImported?45:0)+(role==='test'?5:0);");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
writeFileSync(outputPath, source, {flag: "wx", mode: 0o600});
process.stdout.write(`${JSON.stringify({base_sha256: hash(readFileSync(basePath)), candidate_sha256: hash(source), output: outputPath})}\n`);
