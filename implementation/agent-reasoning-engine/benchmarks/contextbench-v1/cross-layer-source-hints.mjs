// Bounded, source-only cross-layer hints. Hints are not delivered evidence;
// the caller must read pinned-base source and bind delivery before selection.
import {execFileSync} from 'node:child_process';
import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {basename,dirname,join,isAbsolute} from 'node:path';

const need=(value,reason)=>{if(!value)throw Error('cross-layer-hints.'+reason);};
const categories=[
  ['database-mongo',/^src\/database\/mongo\/(?:main|hash)\.js$/],
  ['database-postgres',/^src\/database\/postgres\/(?:main|hash)\.js$/],
  ['database-redis',/^src\/database\/redis\/(?:main|hash)\.js$/],
  ['schema',/(?:^|\/)(?:openapi|schemas?|api-docs)(?:\/|$)/i],
  ['view',/(?:^|\/)(?:views?|templates?)(?:\/|$)|\.tpl$/i],
  ['client',/(?:^|\/)(?:client|frontend)(?:\/|$)/i],
  ['controller',/(?:^|\/)(?:controllers?)(?:\/|$)/i],
];
const category=path=>categories.find(([,pattern])=>pattern.test(path))?.[0]??null;
const goCategory=(path,anchors)=>{
  if(!/\.(?:go|ya?ml|cue|json)$/i.test(path))return null;
  const tokens=path.toLowerCase().split(/[^a-z0-9]+/);
  const stem=anchors.find(anchor=>tokens.some(token=>token.startsWith(anchor.slice(0,Math.min(anchor.length,6)))));
  if(!stem)return null;
  const group=/^cmd\/.*\.go$/.test(path)?'go-cli':/_test\.go$/.test(path)?'go-test':
    /^(?:internal|config|storage)\/.*\.go$/.test(path)?'go-core':
    /(?:^|\/)testdata\/.*\.(?:ya?ml|json)$/.test(path)?'go-fixture':
    /^config\/.*\.(?:ya?ml|cue|json)$/.test(path)?'go-schema':null;
  return group?group+'-'+stem:null;
};
const goActionWindow=(lines,path)=>{
  const action=/(?:^|\/)(import|export)(?:er)?\.go$/.exec(path)?.[1];
  if(!action)return null;
  const method=action==='import'?'Import':'Export';
  let index=lines.findIndex(line=>new RegExp(`^func\\s+(?:\\([^)]*\\)\\s*)?${method}\\s*\\(`).test(line));
  const cli=path.startsWith('cmd/');
  if(index<0&&cli)index=lines.findIndex(line=>/^func\s+\([^)]*\)\s+run\s*\(/.test(line));
  if(index<0)return null;
  const start=Math.max(1,index-4),next=lines.findIndex((line,i)=>i>index&&/^func\s/.test(line));
  return {start_line:start,end_line:Math.min(lines.length,cli?start+99:next<0?start+199:next,start+199)};
};
const normalizeIssue=text=>{
  if(text.startsWith('"'))try{const parsed=JSON.parse(text);if(typeof parsed==='string')return parsed;}catch{}
  return text;
};
const genericStopwords=new Set(['about','across','after','again','allow','already','application','between','could','description','existing','feature','first','following','from','have','issue','should','support','their','there','these','title','using','would','which','while','with']);
const issueAnchors=issue=>[...new Set((issue.slice(0,240).toLowerCase().match(/[a-z]{5,}/g)??[])
  .map(token=>token.endsWith('s')&&!token.endsWith('ss')?token.slice(0,-1):token)
  .filter(token=>!genericStopwords.has(token)))].slice(0,12);
const methodIntentScore=(method,issue)=>{
  const name=method.toLowerCase(),text=issue.toLowerCase();
  if(/expir|validat|confirm/.test(text)&&/expir|ttl/.test(name))return 3;
  if(/incremen|bulk/.test(text)&&/incremen|incr|bulk/.test(name))return 3;
  if(/field|object/.test(text)&&/object|field/.test(name))return 2;
  return 0;
};

export function selectCrossLayerSourceHints({root,problem_statement,existingPaths=[],maximum=4}){
  need(typeof root==='string'&&isAbsolute(root)&&typeof problem_statement==='string'&&problem_statement.length>0,'inputs');
  need(Array.isArray(existingPaths)&&existingPaths.every(path=>typeof path==='string')&&Number.isSafeInteger(maximum)&&maximum>=0&&maximum<=4,'bounds');
  if(maximum===0)return [];
  const base=realpathSync(root),issue=normalizeIssue(problem_statement);
  let goProject=false;try{goProject=lstatSync(join(base,'go.mod')).isFile();}catch{}
  const identifiers=[...new Set(issue.match(/\b[A-Za-z][a-z0-9]*(?:[A-Z][a-z0-9]+)+\b/g)??[])].filter(term=>term.length>=8).slice(0,8);
  const objectiveTokens=new Set(issue.toLowerCase().split(/[^a-z0-9]+/));
  const accountSettings=objectiveTokens.has('account')&&objectiveTokens.has('settings');
  const anchors=issueAnchors(issue);
  const dbMethods=new Set();
  for(const path of existingPaths.slice(0,12)){
    if(!/^[a-zA-Z0-9_./-]+$/.test(path)||path.includes('..'))continue;
    const target=join(base,path);
    let stat;try{stat=lstatSync(target);}catch{continue;}
    if(!stat.isFile()||stat.size>256*1024)continue;
    const source=readFileSync(target,'utf8');
    if(!/require\(['"][^'"]*database['"]\)/.test(source)&&!path.startsWith('src/database/'))continue;
    for(const match of source.matchAll(/\bdb\.([A-Za-z][A-Za-z0-9]*)\b/g))dbMethods.add(match[1]);
    if(path.startsWith('src/database/'))
      for(const match of source.matchAll(/\bmodule\.([A-Za-z][A-Za-z0-9]*)\s*=/g))dbMethods.add(match[1]);
  }
  if(!identifiers.length&&!accountSettings&&anchors.length<2&&!dbMethods.size)return [];
  const tracked=execFileSync('git',['-c',`safe.directory=${base}`,'ls-files','-z'],{cwd:base,encoding:'buffer',timeout:120000,maxBuffer:16*1024*1024})
    .toString('utf8').split('\0').filter(Boolean).sort();
  const namedGoDirs=new Map();
  if(goProject)for(const identifier of identifiers){
    for(const path of tracked){
      if(basename(path).toLowerCase()!==identifier.toLowerCase()+'.go')continue;
      const family=identifier.match(/^[A-Z][a-z0-9]*/)?.[0]??identifier;
      namedGoDirs.set(dirname(path),{identifier,family});
    }
  }
  const existing=new Set(existingPaths),candidates=[];
  for(const path of tracked){
    const namedGo=namedGoDirs.get(dirname(path));
    const exactNamedGo=namedGo&&basename(path).toLowerCase()===namedGo.identifier.toLowerCase()+'.go';
    const siblingGo=namedGo&&!exactNamedGo&&/\.go$/.test(path)&&!/_test\.go$/.test(path);
    const layer=goProject?(exactNamedGo?'go-named-'+namedGo.identifier.toLowerCase():
      siblingGo?'go-named-sibling-'+basename(path):goCategory(path,anchors)):category(path);
    if(!layer||existing.has(path)||!(/\.(?:go|ya?ml|cue|json)$/i.test(path)&&goProject)&&!(/\.(?:js|jsx|ts|tsx|json|ya?ml|tpl)$/i.test(path)&&!goProject))continue;
    let stat;try{stat=lstatSync(join(base,path));}catch{continue;}
    if(!stat.isFile()||stat.size>256*1024)continue;
    const lines=readFileSync(join(base,path),'utf8').split(/\r?\n/);
    const backendMethods=layer.startsWith('database-')?[...dbMethods].filter(method=>
      lines.some(line=>line.includes('module.'+method+' =')||line.includes('module.'+method+'=')))
      .sort((a,b)=>methodIntentScore(b,issue)-methodIntentScore(a,issue)||a.localeCompare(b)):[];
    const identifier=identifiers.find(term=>lines.some(line=>line.includes(term)))??null;
    const pathTokens=path.toLowerCase().split(/[^a-z0-9]+/);
    const accountPath=accountSettings&&pathTokens.includes('settings')&&pathTokens.some(token=>token==='account'||token==='accounts');
    const pathAnchors=anchors.filter(anchor=>pathTokens.some(token=>token.startsWith(anchor)));
    const source=lines.join('\n').toLowerCase();
    const sourceAnchors=anchors.filter(anchor=>source.includes(anchor));
    const genericMatch=pathAnchors.length>0&&sourceAnchors.length>=2;
    const goMatch=goProject&&pathAnchors.length>0&&sourceAnchors.length>=1;
    const namedGoMatch=(exactNamedGo||siblingGo)&&
      (source.includes(namedGo.identifier.toLowerCase())||source.includes('new'+namedGo.family.toLowerCase()));
    if(!identifier&&!accountPath&&!genericMatch&&!backendMethods.length&&!goMatch&&!namedGoMatch)continue;
    const lineIndex=backendMethods.length?lines.findIndex(line=>line.includes('module.'+backendMethods[0])):
      identifier?lines.findIndex(line=>line.includes(identifier)):
      accountPath?lines.findIndex(line=>/settings/i.test(line)):
      goMatch?lines.findIndex(line=>sourceAnchors.some(anchor=>line.toLowerCase().includes(anchor))):
      lines.findIndex(line=>sourceAnchors.filter(anchor=>line.toLowerCase().includes(anchor)).length>=2);
    const position=Math.max(0,lineIndex);
    const goWindow=goProject?goActionWindow(lines,path):null;
    const goScore=exactNamedGo?200:siblingGo&&namedGoMatch?160:
      layer.startsWith('go-cli')?130:layer.startsWith('go-core')?120:
      layer.startsWith('go-test')?80:layer.startsWith('go-schema')?70:60;
    candidates.push({path,kind:'cross-layer',layer,start_line:goWindow?.start_line??Math.max(1,position-7),end_line:goWindow?.end_line??Math.min(lines.length,position+33),
      matched_terms:backendMethods.length?backendMethods:identifier?[identifier]:accountPath?['account','settings']:sourceAnchors,
      score_units:goProject?goScore+5*pathAnchors.length+sourceAnchors.length+(identifier?20:0):
        backendMethods.length?80+Math.min(backendMethods.length,4)*5:identifier?100:accountPath?60:30+10*pathAnchors.length+5*sourceAnchors.length});
  }
  const order=new Map(categories.map(([name],index)=>[name,index]));
  candidates.sort((a,b)=>b.score_units-a.score_units||(order.get(a.layer)??99)-(order.get(b.layer)??99)||a.path.localeCompare(b.path));
  const chosen=[],layers=new Set();
  for(const candidate of candidates){if(layers.has(candidate.layer))continue;chosen.push(candidate);layers.add(candidate.layer);if(chosen.length===maximum)break;}
  return chosen;
}
