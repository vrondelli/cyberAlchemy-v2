import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root=path.resolve(import.meta.dirname,'..');
const load=name=>JSON.parse(readFileSync(path.join(root,name),'utf8'));
const manifest=load('package.json');
const grammar=load('syntaxes/alch.tmLanguage.json');
const language=load('language-configuration.json');
const resolveTheme=relative=>{
  const theme=load(relative);
  if(!theme.include)return theme;
  const inherited=resolveTheme(path.posix.join(path.posix.dirname(relative),theme.include));
  return {...inherited,...theme,colors:{...inherited.colors,...theme.colors},tokenColors:[...(inherited.tokenColors??[]),...(theme.tokenColors??[])]};
};
const themes=manifest.contributes.themes.map(contribution=>({contribution,theme:load(contribution.path),resolvedTheme:resolveTheme(contribution.path)}));
const patterns=name=>grammar.repository[name].patterns;
const regex=pattern=>new RegExp(pattern.match??pattern.begin,'u');
const match=(repositoryName,text)=>patterns(repositoryName).map(pattern=>({pattern,result:regex(pattern).exec(text)})).find(candidate=>candidate.result);
const matches=(repositoryName,text)=>Boolean(match(repositoryName,text));
const captureScope=(repositoryName,text,index)=>{
  const candidate=match(repositoryName,text);
  assert.ok(candidate,`${repositoryName} should match: ${text}`);
  const captures=candidate.pattern.captures??candidate.pattern.beginCaptures;
  assert.ok(captures?.[index],`${repositoryName} capture ${index} should be scoped: ${text}`);
  return {scope:captures[index].name,value:candidate.result[index],rule:candidate.pattern.name};
};
const topLevelRules=grammar.patterns.flatMap(include=>patterns(include.include.slice(1)).map(pattern=>({repository:include.include.slice(1),pattern})));
const firstWinner=text=>topLevelRules.map((candidate,order)=>({
  ...candidate,order,result:regex(candidate.pattern).exec(text)
})).filter(candidate=>candidate.result).sort((left,right)=>left.result.index-right.result.index||left.order-right.order)[0];
const files=directory=>readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
const themeScopes=theme=>new Set(theme.tokenColors.flatMap(rule=>Array.isArray(rule.scope)?rule.scope:[rule.scope]));
const themeColor=(theme,scope)=>[...theme.tokenColors].reverse().find(rule=>(Array.isArray(rule.scope)?rule.scope:[rule.scope]).includes(scope))?.settings.foreground;
const luminance=hex=>{
  const channels=hex.slice(1).match(/../g).slice(0,3).map(channel=>parseInt(channel,16)/255).map(channel=>channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4);
  return 0.2126*channels[0]+0.7152*channels[1]+0.0722*channels[2];
};
const contrast=(left,right)=>{
  const [lighter,darker]=[luminance(left),luminance(right)].sort((a,b)=>b-a);
  return (lighter+0.05)/(darker+0.05);
};

test('extension binds .alch, grammar, configuration, and light/dark icons',()=>{
  const contribution=manifest.contributes.languages[0],grammarContribution=manifest.contributes.grammars[0];
  assert.equal(contribution.id,'alchlang');
  assert.deepEqual(contribution.extensions,['.alch']);
  assert.equal(grammarContribution.language,'alchlang');
  assert.equal(grammarContribution.scopeName,'source.alch');
  for(const relative of [contribution.configuration,contribution.icon.light,contribution.icon.dark,grammarContribution.path])assert.doesNotThrow(()=>readFileSync(path.resolve(root,relative)));
  assert.equal(language.comments.lineComment,'#');
  assert.deepEqual(language.brackets,[['{','}'],['[',']'],['(',')']]);
});

test('extension contributes optional dark and light AlchLang color layers',()=>{
  assert.deepEqual(manifest.contributes.themes.map(theme=>({id:theme.id,uiTheme:theme.uiTheme})),[
    {id:'alchlang-dark',uiTheme:'vs-dark'},
    {id:'alchlang-light',uiTheme:'vs'}
  ]);
  for(const {contribution,theme,resolvedTheme} of themes){
    assert.doesNotThrow(()=>readFileSync(path.resolve(root,contribution.path)));
    assert.equal(theme.name,contribution.label);
    assert.match(resolvedTheme.colors['editor.background'],/^#[0-9A-Fa-f]{6}$/);
    assert.ok(Array.isArray(theme.tokenColors)&&theme.tokenColors.length>0);
  }
});

test('local VSIX packaging is pinned and excludes development-only files',()=>{
  assert.equal(manifest.private,true);
  assert.equal(manifest.publisher,'cyberalchemy-local');
  assert.equal(manifest.version,'0.3.8');
  assert.equal(manifest.main,'./extension.js');
  assert.equal(manifest.browser,'./extension.js');
  assert.deepEqual(manifest.activationEvents,['onCommand:alchlang.configureColors']);
  assert.deepEqual(manifest.contributes.commands,[{command:'alchlang.configureColors',title:'Configure Colors',category:'AlchLang'}]);
  assert.equal(manifest.scripts['package:vsix'],'npx --yes @vscode/vsce@3.9.2 package --out alchlang-language-support-0.3.8.vsix');
  assert.deepEqual(readFileSync(path.join(root,'.vscodeignore'),'utf8').trim().split(/\r?\n/),['test/**','*.vsix']);
});

test('dark layer portably inherits the pinned MIT Monokai Dimmed base',()=>{
  const {theme,resolvedTheme}=themes.find(({contribution})=>contribution.id==='alchlang-dark');
  assert.equal(theme.name,'AlchLang Monokai Dimmed');
  assert.equal(theme.include,'./monokai-dimmed-base-color-theme.json');
  assert.equal(resolvedTheme.colors['editor.background'],'#1e1e1e');
  const baseBytes=readFileSync(path.join(root,'themes/monokai-dimmed-base-color-theme.json'));
  assert.equal(createHash('sha256').update(baseBytes).digest('hex'),'3feffef6f446c34d019696ae89904fcb3c561959e5cb1b36c5aba7fbc58218be');
  assert.match(readFileSync(path.join(root,'themes/MONOKAI-DIMMED-LICENSE.txt'),'utf8'),/^MIT License/);
});

test('every emitted non-meta Alch scope has an explicit color in both themes',()=>{
  const emitted=new Set();
  const visit=value=>{
    if(Array.isArray(value))for(const child of value)visit(child);
    else if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){
      if(key==='name'&&typeof child==='string'&&child.endsWith('.alch')&&!child.startsWith('meta.'))emitted.add(child);
      else visit(child);
    }
  };
  visit(grammar.repository);
  assert.ok(emitted.has('keyword.other.clause.alch'));
  for(const {theme} of themes)for(const scope of emitted)assert.equal(themeScopes(theme).has(scope),true,`${theme.name}: ${scope}`);
});

test('theme token colors meet 4.5 contrast and repair the reported clause property',()=>{
  for(const {theme,resolvedTheme} of themes){
    const background=resolvedTheme.colors['editor.background'];
    for(const rule of theme.tokenColors){
      const foreground=rule.settings.foreground;
      assert.match(foreground,/^#[0-9A-F]{6}$/,`${theme.name}: ${rule.name}`);
      assert.ok(contrast(foreground,background)>=4.5,`${theme.name}: ${rule.name} contrast ${contrast(foreground,background).toFixed(2)}`);
    }
    const clause=themeColor(theme,'keyword.other.clause.alch');
    assert.notEqual(clause,'#676867');
    assert.ok(contrast(clause,background)>=4.5);
  }
});

test('dark AlchLang scopes use the pinned dimmed palette',()=>{
  const dark=themes.find(({contribution})=>contribution.id==='alchlang-dark').theme;
  const expected=new Map([
    ['comment.line.number-sign.alch','#8C8D8B'],
    ['string.quoted.double.alch','#8E9A3A'],
    ['storage.type.declaration.alch','#7D7DDD'],
    ['keyword.control.directive.alch','#B77A48'],
    ['keyword.other.reference.alch','#7189A3'],
    ['entity.name.type.reference.alch','#C76A70'],
    ['support.type.primitive.alch','#5BA9B8'],
    ['support.function.alch','#B09A4C'],
    ['constant.language.boolean.alch','#9A78D0'],
    ['constant.numeric.alch','#8FA887'],
    ['keyword.operator.comparison.alch','#9FA29F']
  ]);
  for(const [scope,color] of expected)assert.equal(themeColor(dark,scope),color,scope);
});

test('reference keywords and operands use distinct colors in both themes',()=>{
  for(const source of ['  grounded-by MeaningfulTokensHaveBoundaries','  intrinsic ContainsPhrase','  operation append-reason']){
    assert.equal(captureScope('references',source,2).scope,'keyword.other.reference.alch');
    assert.equal(captureScope('references',source,3).scope,'entity.name.type.reference.alch');
  }
  for(const {theme} of themes){
    const keyword=themeColor(theme,'keyword.other.reference.alch');
    const operand=themeColor(theme,'entity.name.type.reference.alch');
    assert.ok(keyword&&operand,theme.name);
    assert.notEqual(keyword,operand,theme.name);
  }
  const dark=themes.find(({contribution})=>contribution.id==='alchlang-dark').theme;
  assert.equal(themeColor(dark,'entity.name.type.reference.alch'),'#C76A70');
  assert.notEqual(themeColor(dark,'entity.name.type.reference.alch'),themeColor(dark,'string.quoted.double.alch'));
});

test('adjacent semantic roles keep distinct theme colors',()=>{
  for(const {theme} of themes){
    const different=(left,right)=>assert.notEqual(themeColor(theme,left),themeColor(theme,right),`${theme.name}: ${left} and ${right}`);
    different('support.type.primitive.alch','string.quoted.double.alch');
    different('keyword.control.directive.alch','constant.language.boolean.alch');
    different('keyword.other.clause.alch','constant.language.boolean.alch');
    different('keyword.control.directive.alch','constant.language.null.alch');
    different('keyword.other.clause.alch','constant.language.null.alch');
    different('variable.other.readwrite.alch','constant.numeric.alch');
  }
});

test('every grammar regular expression compiles in the dependency-free validator',()=>{
  const visit=value=>{
    if(Array.isArray(value))for(const child of value)visit(child);
    else if(value&&typeof value==='object')for(const [key,child] of Object.entries(value)){
      if(['match','begin','end'].includes(key))assert.doesNotThrow(()=>new RegExp(child,'u'),`${key}: ${child}`);
      else visit(child);
    }
  };
  visit(grammar);
});

test('top-level declarations use category-specific name scopes',()=>{
  assert.deepEqual(captureScope('declarations','entity Order:',2),{scope:'entity.name.type.alch',value:'Order',rule:'meta.declaration.type.alch'});
  assert.deepEqual(captureScope('declarations','configuration RuntimeSemanticCore:',1),{scope:'storage.type.declaration.alch',value:'configuration',rule:'meta.declaration.type.alch'});
  assert.deepEqual(captureScope('declarations','configuration RuntimeSemanticCore:',2),{scope:'entity.name.type.alch',value:'RuntimeSemanticCore',rule:'meta.declaration.type.alch'});
  assert.deepEqual(captureScope('declarations','operation CommitOrder:',2),{scope:'entity.name.function.alch',value:'CommitOrder',rule:'meta.declaration.callable.alch'});
  assert.deepEqual(captureScope('declarations','invariant TokenMatchingDoesNotCollapseSubstrings:',2),{scope:'entity.name.type.rule.alch',value:'TokenMatchingDoesNotCollapseSubstrings',rule:'meta.declaration.governance.alch'});
});

test('configuration highlighting is generic and does not encode an ARE instance name',()=>{
  for(const name of ['RuntimeSemanticCore','EditorTheme','AnyProductConfiguration']){
    const source=`configuration ${name}:`;
    assert.equal(patterns('declarations').filter(pattern=>regex(pattern).test(source)).length,1,source);
    assert.equal(captureScope('declarations',source,2).value,name);
  }
  assert.doesNotMatch(JSON.stringify(grammar),/AreProductionSemanticCore/);
  assert.equal(matches('declarations','  configuration NestedConfiguration:'),false);
});

test('module configuration vocabulary uses reusable declaration scopes',()=>{
  for(const source of ['module SemanticPrelude:','capability ContainsPhrase:']){
    assert.equal(captureScope('declarations',source,1).scope,'storage.type.declaration.alch');
    assert.equal(captureScope('declarations',source,2).scope,'entity.name.type.alch');
  }
});

test('top-level headers scope their values and imports',()=>{
  assert.deepEqual(captureScope('headers','domain alch-semantic-prelude "Semantic prelude"',2),{scope:'entity.name.namespace.alch',value:'alch-semantic-prelude',rule:'meta.header.namespace.alch'});
  assert.equal(captureScope('headers','profile semantic-contract-v1',2).scope,'constant.other.symbol.alch');
  assert.equal(captureScope('headers','runtime node>=26.8.1',2).value,'node>=26.8.1');
  assert.equal(captureScope('headers','import Capabilities from "./capabilities.alch"',2).scope,'entity.name.type.alch');
  assert.equal(captureScope('headers','import Capabilities from "./capabilities.alch"',4).scope,'string.quoted.double.alch');
});

test('indented declaration words are references or clauses, never top-level declarations or headers',()=>{
  for(const source of ['  action place-order','  boundary order-transaction-authority','  operation place-order','  event order-placed','  intrinsic NormalizeNfkc','  invariant NfkcNormalizationIsIdempotent']){
    assert.equal(matches('declarations',source),false,source);
    assert.equal(captureScope('references',source,3).scope,'entity.name.type.reference.alch');
  }
  for(const source of ['  owner order-domain-owner','  target OrderOperation','  runtime rust'])assert.equal(matches('headers',source),false,source);
  assert.equal(captureScope('symbolicValues','  runtime rust',3).scope,'constant.other.symbol.alch');
});

test('field, symbol, reference, environment, directive, and expression contexts stay orthogonal',()=>{
  assert.equal(firstWinner('  status: string required').pattern.name,'meta.field.primitive.alch');
  assert.equal(captureScope('fieldDeclarations','  status: string required',2).scope,'variable.other.property.alch');
  assert.equal(captureScope('fieldDeclarations','  status: string required',5).scope,'support.type.primitive.alch');
  assert.equal(captureScope('symbolicValues','  status quoted',3).scope,'constant.other.symbol.alch');
  assert.equal(firstWinner('  expression status == "pending"').pattern.name,'meta.expression.alch');
  assert.equal(captureScope('references','  target OrderOperation',3).scope,'entity.name.type.reference.alch');
  assert.equal(captureScope('symbolicValues','  url-env PRICE_URL',3).scope,'variable.other.constant.alch');
  assert.equal(captureScope('directives','  timeout-ms 5000',2).scope,'keyword.control.directive.alch');
  assert.equal(captureScope('directives','  let normalized = lower(input.name)',3).scope,'variable.other.readwrite.alch');
});

test('named field types do not consume lowercase dotted expressions',()=>{
  assert.equal(captureScope('fieldDeclarations','  snapshot: PriceSnapshot',5).scope,'entity.name.type.alch');
  assert.equal(captureScope('fieldDeclarations','  envelope: Pricing.Envelope[]',5).value,'Pricing.Envelope');
  assert.equal(matches('fieldDeclarations','  amountMinor: best.amountMinor'),true);
  assert.equal(patterns('fieldDeclarations')[1].match&&regex(patterns('fieldDeclarations')[1]).test('  amountMinor: best.amountMinor'),false);
  assert.equal(matches('memberPaths','best.amountMinor'),true);
});

test('identifier-aware boundaries prevent partial-token collapse',()=>{
  for(const source of ['requiredness','required-field']){
    assert.equal(matches('constants',source),false,source);
    assert.equal(regex(patterns('fieldDeclarations')[3]).test(source),false,source);
  }
  assert.equal(matches('clauseKeywords','operation-pending'),false);
  assert.equal(matches('clauseKeywords','order-domain-owner'),false);
  const primitive=match('types','string-array');
  assert.equal(primitive.result[0],'string-array');
  assert.equal(firstWinner('string(value)').pattern.name,'meta.function-call.alch');
});

test('every corpus declaration matches exactly one declaration category',()=>{
  const corpus=path.resolve(root,'../..');
  const declarations=files(corpus).filter(file=>file.endsWith('.alch')).flatMap(file=>readFileSync(file,'utf8').split(/\r?\n/)).filter(line=>/^[a-z][a-z-]* [A-Za-z][A-Za-z0-9_-]*:/.test(line));
  assert.ok(declarations.length>0);
  for(const declaration of declarations){
    const count=patterns('declarations').filter(pattern=>regex(pattern).test(declaration)).length;
    assert.equal(count,1,declaration);
  }
});

test('no indented corpus line matches a top-level declaration or header',()=>{
  const corpus=path.resolve(root,'../..');
  const lines=files(corpus).filter(file=>file.endsWith('.alch')).flatMap(file=>readFileSync(file,'utf8').split(/\r?\n/)).filter(line=>/^\s+\S/.test(line));
  assert.ok(lines.length>0);
  for(const line of lines){
    assert.equal(matches('declarations',line),false,line);
    assert.equal(matches('headers',line),false,line);
  }
});

test('icons are passive bounded SVG assets',()=>{
  for(const name of ['icons/alch-light.svg','icons/alch-dark.svg']){
    const svg=readFileSync(path.join(root,name),'utf8');
    assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.doesNotMatch(svg,/<script|javascript:|(?:href|src)=["']https?:/i);
    assert.match(svg,/viewBox="0 0 64 64"/);
  }
});
