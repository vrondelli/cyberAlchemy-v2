'use strict';

const CUSTOM_RULE_PREFIX='AlchLang custom:';

const ROLE_DEFINITIONS=Object.freeze([
  {id:'comments',label:'Comments',sample:'# explanation',scopes:['comment.line.number-sign.alch']},
  {id:'strings',label:'Strings',sample:'"Equivalent language"',scopes:['string.quoted.double.alch','punctuation.definition.string.begin.alch','punctuation.definition.string.end.alch','constant.character.escape.alch']},
  {id:'declarations',label:'Declarations',sample:'ontology',scopes:['storage.type.declaration.alch','storage.modifier.array.alch','storage.modifier.field.alch']},
  {id:'control',label:'Control and directives',sample:'require',scopes:['keyword.control.header.alch','keyword.control.import.alch','keyword.control.directive.alch','keyword.control.quantifier.alch']},
  {id:'clauses',label:'Clause properties',sample:'meaning',scopes:['keyword.other.clause.alch','keyword.other.environment.alch','keyword.other.diagnostic.alch']},
  {id:'referenceKeywords',label:'Reference keywords',sample:'grounded-by',scopes:['keyword.other.reference.alch']},
  {id:'referenceOperands',label:'Reference operands',sample:'MeaningfulTokensHaveBoundaries',scopes:['entity.name.type.reference.alch']},
  {id:'types',label:'Types and namespaces',sample:'PriceSnapshot',scopes:['entity.name.type.alch','entity.name.type.rule.alch','entity.name.namespace.alch','support.type.primitive.alch']},
  {id:'callables',label:'Callables',sample:'append-reason',scopes:['entity.name.function.alch','support.function.alch']},
  {id:'variables',label:'Properties and variables',sample:'amountMinor',scopes:['variable.other.property.alch','variable.other.member.alch','variable.other.readwrite.alch','variable.other.constant.alch']},
  {id:'symbols',label:'Symbolic constants',sample:'taken-as-given',scopes:['constant.other.symbol.alch','constant.language.status.alch']},
  {id:'languageConstants',label:'Booleans and none',sample:'true',scopes:['constant.language.boolean.alch','constant.language.null.alch']},
  {id:'numbers',label:'Numbers',sample:'200',scopes:['constant.numeric.alch']},
  {id:'operators',label:'Operators',sample:'>=',scopes:['keyword.operator.arrow.alch','keyword.operator.comparison.alch','keyword.operator.arithmetic.alch','keyword.operator.assignment.alch','keyword.operator.logical.alch']},
  {id:'punctuation',label:'Punctuation',sample:':',scopes:['punctuation.separator.alch','punctuation.separator.key-value.alch','punctuation.section.alch']}
]);

const PRESETS=Object.freeze({
  vivid:Object.freeze({comments:'#B2B2B1',strings:'#D5ED35',declarations:'#3838FF',control:'#EF7D1F',clauses:'#F78222',referenceKeywords:'#3890F5',referenceOperands:'#DB0A18',types:'#55DCF7',callables:'#E2B928',variables:'#31F652',symbols:'#A5A5FF',languageConstants:'#A675F5',numbers:'#B4C4AE',operators:'#BEC1BE',punctuation:'#B2B2B1'}),
  dark:Object.freeze({comments:'#8C8D8B',strings:'#8E9A3A',declarations:'#7D7DDD',control:'#B77A48',clauses:'#B77A48',referenceKeywords:'#7189A3',referenceOperands:'#C76A70',types:'#5BA9B8',callables:'#B09A4C',variables:'#7189A3',symbols:'#7D7DDD',languageConstants:'#9A78D0',numbers:'#8FA887',operators:'#9FA29F',punctuation:'#8C8D8B'}),
  light:Object.freeze({comments:'#008000',strings:'#A31515',declarations:'#AF00DB',control:'#0000FF',clauses:'#0451A5',referenceKeywords:'#0451A5',referenceOperands:'#795E26',types:'#267F6E',callables:'#795E26',variables:'#0451A5',symbols:'#795E26',languageConstants:'#811F7C',numbers:'#00733E',operators:'#1F1F1F',punctuation:'#666666'})
});

const DISTINCTIONS=Object.freeze([
  ['referenceKeywords','referenceOperands'],['referenceOperands','strings'],['types','strings'],
  ['control','languageConstants'],['clauses','languageConstants'],['variables','numbers']
]);

const normalizeHex=value=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value.toUpperCase():null;

function normalizePalette(candidate){
  const palette={};
  for(const role of ROLE_DEFINITIONS){
    const color=normalizeHex(candidate?.[role.id]);
    if(!color)throw new TypeError(`Invalid color for ${role.id}`);
    palette[role.id]=color;
  }
  return palette;
}

function rulesForPalette(candidate){
  const palette=normalizePalette(candidate);
  return ROLE_DEFINITIONS.map(role=>({
    name:`${CUSTOM_RULE_PREFIX}${role.id}`,
    scope:role.scopes.length===1?role.scopes[0]:[...role.scopes],
    settings:{foreground:palette[role.id]}
  }));
}

const isRecord=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const cloneRecord=value=>isRecord(value)?JSON.parse(JSON.stringify(value)):{};
const themeKey=themeName=>`[${String(themeName||'Current Theme').replace(/[\[\]]/g,'')}]`;
const isAlchRule=rule=>typeof rule?.name==='string'&&rule.name.startsWith(CUSTOM_RULE_PREFIX);

function applyPalette(current,themeName,candidate){
  const result=cloneRecord(current),key=themeKey(themeName),bucket=cloneRecord(result[key]);
  const existing=Array.isArray(bucket.textMateRules)?bucket.textMateRules.filter(rule=>!isAlchRule(rule)):[];
  bucket.textMateRules=[...existing,...rulesForPalette(candidate)];
  result[key]=bucket;
  return result;
}

function resetPalette(current,themeName){
  const result=cloneRecord(current),key=themeKey(themeName),bucket=cloneRecord(result[key]);
  if(!Object.hasOwn(result,key))return result;
  const existing=Array.isArray(bucket.textMateRules)?bucket.textMateRules.filter(rule=>!isAlchRule(rule)):[];
  if(existing.length)bucket.textMateRules=existing;else delete bucket.textMateRules;
  if(Object.keys(bucket).length)result[key]=bucket;else delete result[key];
  return result;
}

function paletteFromCustomizations(current,themeName,fallback){
  const palette={...fallback},rules=current?.[themeKey(themeName)]?.textMateRules;
  if(!Array.isArray(rules))return palette;
  for(const rule of rules){
    if(!isAlchRule(rule))continue;
    const id=rule.name.slice(CUSTOM_RULE_PREFIX.length),color=normalizeHex(rule.settings?.foreground);
    if(Object.hasOwn(palette,id)&&color)palette[id]=color;
  }
  return palette;
}

function exportThemeDocument(themeName,themeType,candidate,background,foreground){
  const palette=normalizePalette(candidate),type=themeType==='light'?'light':'dark';
  return {
    $schema:'vscode://schemas/color-theme',
    name:`${String(themeName||'Current Theme').replace(/[\r\n]+/g,' ').trim()} — AlchLang Custom`,
    type,
    colors:{'editor.background':normalizeHex(background)||(type==='light'?'#FFFFFF':'#1E1E1E'),'editor.foreground':normalizeHex(foreground)||(type==='light'?'#1F1F1F':'#D4D4D4')},
    tokenColors:rulesForPalette(palette)
  };
}

const nonce=()=>Array.from({length:32},()=>Math.floor(Math.random()*36).toString(36)).join('');
const escapeAttribute=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');

function getWebviewHtml(webview,styleUri,scriptUri,pageNonce=nonce()){
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${escapeAttribute(webview.cspSource)} 'unsafe-inline'; script-src 'nonce-${escapeAttribute(pageNonce)}';">
  <link rel="stylesheet" href="${escapeAttribute(styleUri)}">
  <title>AlchLang Color Studio</title>
</head>
<body>
  <header class="hero">
    <p class="eyebrow">ALCHLANG LANGUAGE SUPPORT</p>
    <h1>Color Studio</h1>
    <p>Shape each semantic role without changing the AlchLang grammar.</p>
  </header>
  <main>
    <section class="panel preview-panel" aria-labelledby="preview-heading">
      <div class="section-heading"><div><p class="eyebrow">LIVE TOKEN INSPECTOR</p><h2 id="preview-heading">Select a word to inspect it</h2></div><span id="theme-name" class="theme-chip"></span></div>
      <div class="studio-toolbar"><p class="hint">Select a word, then change that role directly here.</p><div class="preset-actions"><button type="button" data-preset="vivid">Vivid base</button><button type="button" data-preset="dark">Dimmed base</button><button type="button" data-preset="light">Light base</button><button id="import-theme" type="button">Import theme as base</button><input id="theme-file" type="file" accept=".json,.jsonc,application/json" hidden></div></div>
      <pre id="preview" class="preview" tabindex="0" aria-label="Live AlchLang color preview"><code><span data-role="declarations">ontology</span> <span data-role="types">ALCH-AXIOM-UNICODE</span>
  <span data-role="clauses">meaning</span> <span data-role="strings">"Equivalent language can have distinct representations."</span>
  <span data-role="referenceKeywords">grounded-by</span> <span data-role="referenceOperands">MeaningfulTokensHaveBoundaries</span>
  <span data-role="referenceKeywords">intrinsic</span> <span data-role="referenceOperands">ContainsPhrase</span>
  <span data-role="control">require</span> <span data-role="variables">normalizedText</span> <span data-role="operators">==</span> <span data-role="languageConstants">true</span>
  <span data-role="variables">attempts</span><span data-role="punctuation">:</span> <span data-role="types">uint64</span> <span data-role="numbers">3</span>
  <span data-role="referenceKeywords">operation</span> <span data-role="callables">append-reason</span>
  <span data-role="symbols">commitment</span> <span data-role="symbols">taken-as-given</span>
  <span data-role="comments"># user-owned token colors</span></code></pre>
      <div id="token-inspector" class="token-inspector" aria-live="polite">
        <input id="selected-picker" type="color" value="#808080" aria-label="Selected role color picker" disabled>
        <div><span class="inspector-label">Selected word</span><strong id="selected-token">Choose a colored word above</strong></div>
        <div><span class="inspector-label">Semantic role</span><strong id="selected-role">—</strong></div>
        <div><label class="inspector-label" for="selected-color">Current color</label><div class="selected-color-controls"><input id="selected-color" type="text" value="" pattern="#[0-9A-Fa-f]{6}" maxlength="7" spellcheck="false" aria-label="Selected role hexadecimal color" disabled><output id="selected-contrast" class="contrast"></output></div></div>
      </div>
      <div id="quality-summary" class="quality-summary" aria-live="polite"></div>
      <p id="base-status" class="base-status" aria-live="polite">Current theme settings are the editable base.</p>
      <div class="studio-footer"><p id="save-note" class="hint">Nothing changes in settings until you apply. Other token rules remain intact.</p><div class="primary-actions"><button id="export" type="button">Export theme</button><button id="copy" type="button">Copy settings JSON</button><button id="reset" type="button">Reset this theme</button><button id="apply" class="primary" type="button">Apply to this theme</button></div></div>
    </section>
  </main>
  <div id="status" class="status" role="status" aria-live="polite"></div>
  <script nonce="${escapeAttribute(pageNonce)}" src="${escapeAttribute(scriptUri)}"></script>
</body>
</html>`;
}

function activate(context){
  const vscode=require('vscode');
  context.subscriptions.push(vscode.commands.registerCommand('alchlang.configureColors',()=>{
    const mediaRoot=vscode.Uri.joinPath(context.extensionUri,'media');
    const panel=vscode.window.createWebviewPanel('alchlangColorStudio','AlchLang Color Studio',vscode.ViewColumn.One,{enableScripts:true,retainContextWhenHidden:false,localResourceRoots:[mediaRoot]});
    const styleUri=panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot,'configurator.css'));
    const scriptUri=panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot,'configurator.js'));
    panel.webview.html=getWebviewHtml(panel.webview,styleUri,scriptUri);

    const currentState=()=>{
      const themeName=vscode.workspace.getConfiguration('workbench').get('colorTheme')||'Current Theme';
      const effective=vscode.workspace.getConfiguration('editor').get('tokenColorCustomizations')||{};
      const lightKinds=new Set([vscode.ColorThemeKind.Light,vscode.ColorThemeKind.HighContrastLight]);
      const isLight=lightKinds.has(vscode.window.activeColorTheme.kind),preset=isLight?PRESETS.light:PRESETS.vivid;
      return {themeName,themeType:isLight?'light':'dark',palette:paletteFromCustomizations(effective,themeName,preset),roles:ROLE_DEFINITIONS,presets:PRESETS,distinctions:DISTINCTIONS};
    };
    const sendState=()=>panel.webview.postMessage({type:'state',...currentState()});
    const userSettings=()=>vscode.workspace.getConfiguration('editor').inspect('tokenColorCustomizations')?.globalValue||{};
    const writeUserSettings=async value=>vscode.workspace.getConfiguration('editor').update('tokenColorCustomizations',Object.keys(value).length?value:undefined,vscode.ConfigurationTarget.Global);

    panel.webview.onDidReceiveMessage(async message=>{
      try{
        if(message?.type==='ready'){await sendState();return;}
        const state=currentState();
        if(message?.type==='apply'){
          await writeUserSettings(applyPalette(userSettings(),state.themeName,message.palette));
          await panel.webview.postMessage({type:'saved',message:`Applied AlchLang colors to ${state.themeName} in User Settings.`});
          await sendState();
        }else if(message?.type==='reset'){
          await writeUserSettings(resetPalette(userSettings(),state.themeName));
          await panel.webview.postMessage({type:'saved',message:`Removed AlchLang custom colors for ${state.themeName}.`});
          await sendState();
        }else if(message?.type==='copy'){
          const snippet={'editor.tokenColorCustomizations':applyPalette({},state.themeName,message.palette)};
          await vscode.env.clipboard.writeText(JSON.stringify(snippet,null,2));
          await panel.webview.postMessage({type:'saved',message:'Copied settings JSON to the clipboard.'});
        }else if(message?.type==='export'){
          const document=exportThemeDocument(state.themeName,state.themeType,message.palette,message.background,message.foreground);
          const target=await vscode.window.showSaveDialog({saveLabel:'Export AlchLang Theme',filters:{'VS Code color theme':['json']}});
          if(!target){await panel.webview.postMessage({type:'saved',message:'Theme export cancelled.'});return;}
          await vscode.workspace.fs.writeFile(target,new TextEncoder().encode(`${JSON.stringify(document,null,2)}\n`));
          await panel.webview.postMessage({type:'saved',message:`Exported ${document.name}.`});
        }
      }catch(error){
        const message=error instanceof Error?error.message:String(error);
        void vscode.window.showErrorMessage(`AlchLang Color Studio: ${message}`);
        await panel.webview.postMessage({type:'error',message});
      }
    },undefined,context.subscriptions);
    const themeListener=vscode.window.onDidChangeActiveColorTheme(sendState);
    panel.onDidDispose(()=>themeListener.dispose(),undefined,context.subscriptions);
  }));
}

exports.activate=activate;
exports.deactivate=()=>{};
exports.__test={CUSTOM_RULE_PREFIX,ROLE_DEFINITIONS,PRESETS,DISTINCTIONS,normalizeHex,normalizePalette,rulesForPalette,themeKey,applyPalette,resetPalette,paletteFromCustomizations,exportThemeDocument,getWebviewHtml};
