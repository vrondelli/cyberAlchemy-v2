import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import test from 'node:test';

const require=createRequire(import.meta.url);
const model=require('../extension.js').__test;
const client=require('../media/configurator.js');
const configuratorCss=readFileSync(new URL('../media/configurator.css',import.meta.url),'utf8');

test('configurator owns every emitted semantic color group',()=>{
  assert.equal(model.ROLE_DEFINITIONS.length,15);
  for(const preset of Object.values(model.PRESETS))assert.deepEqual(Object.keys(preset).sort(),model.ROLE_DEFINITIONS.map(role=>role.id).sort());
  assert.equal(model.rulesForPalette(model.PRESETS.dark).length,15);
});

test('palette validation accepts exact hex colors and rejects malformed input',()=>{
  assert.equal(model.normalizeHex('#c76a70'),'#C76A70');
  assert.equal(model.normalizeHex('#fff'),null);
  assert.throws(()=>model.normalizePalette({...model.PRESETS.dark,strings:'red'}),/Invalid color for strings/);
});

test('client color math parses hex and reports WCAG contrast',()=>{
  assert.deepEqual(client.hexToRgb('#C76A70'),[199,106,112]);
  assert.deepEqual(client.parseRgb('rgb(30, 30, 30)'),[30,30,30]);
  assert.equal(client.contrast([0,0,0],[255,255,255]),21);
  assert.ok(client.contrast(client.hexToRgb('#C76A70'),[30,30,30])>=4.5);
});

test('vivid screenshot palette is a complete editable base',()=>{
  assert.equal(model.PRESETS.vivid.declarations,'#3838FF');
  assert.equal(model.PRESETS.vivid.strings,'#D5ED35');
  assert.equal(model.PRESETS.vivid.referenceOperands,'#DB0A18');
  assert.equal(model.PRESETS.vivid.variables,'#31F652');
  assert.deepEqual(Object.keys(model.PRESETS.vivid).sort(),model.ROLE_DEFINITIONS.map(role=>role.id).sort());
});

test('export documents carry the current palette as a reusable VS Code theme',()=>{
  const host=model.exportThemeDocument('My Theme','dark',model.PRESETS.vivid,'#1e1e1e','#d4d4d4');
  const browser=client.browserThemeDocument('My Theme','dark',model.PRESETS.vivid,model.ROLE_DEFINITIONS,'#1e1e1e','#d4d4d4');
  for(const document of [host,browser]){
    assert.equal(document.$schema,'vscode://schemas/color-theme');
    assert.equal(document.name,'My Theme — AlchLang Custom');
    assert.equal(document.type,'dark');
    assert.deepEqual(document.colors,{'editor.background':'#1E1E1E','editor.foreground':'#D4D4D4'});
    assert.equal(document.tokenColors.length,15);
    assert.equal(document.tokenColors.find(rule=>rule.name.endsWith('referenceOperands')).settings.foreground,'#DB0A18');
  }
  assert.equal(client.safeFileName('My Theme'),'my-theme-alchlang-color-theme.json');
});

test('standalone settings export preserves theme scoping and all roles',()=>{
  const document=client.settingsDocument('My Theme',model.PRESETS.vivid,model.ROLE_DEFINITIONS);
  const rules=document['editor.tokenColorCustomizations']['[My Theme]'].textMateRules;
  assert.equal(rules.length,15);
  assert.equal(rules[0].name,'AlchLang custom:comments');
});

test('JSONC import preserves comment-like strings and accepts trailing commas',()=>{
  const theme=client.parseThemeJson(`\uFEFF{
    // a theme comment
    "name": "Web // Base",
    "tokenColors": [{"scope": "comment", "settings": {"foreground": "#abc",},}],
  }`);
  assert.equal(theme.name,'Web // Base');
  assert.equal(theme.tokenColors.length,1);
});

test('theme import maps generic scopes and preserves unmatched roles',()=>{
  const theme=JSON.stringify({name:'Generic Base',tokenColors:[
    {scope:'comment, punctuation.definition.comment',settings:{foreground:'#abc'}},
    {scope:['string.quoted','constant.numeric'],settings:{foreground:'#445566CC'}},
    {scope:'entity.name.function',settings:{foreground:'#13579B'}}
  ]});
  const imported=client.importThemeBase(theme,model.PRESETS.dark,model.ROLE_DEFINITIONS,'generic.json');
  assert.equal(imported.palette.comments,'#AABBCC');
  assert.equal(imported.palette.strings,'#445566');
  assert.equal(imported.palette.numbers,'#445566');
  assert.equal(imported.palette.callables,'#13579B');
  assert.equal(imported.palette.punctuation,'#AABBCC');
  assert.equal(imported.palette.control,model.PRESETS.dark.control);
  assert.equal(imported.report.matchedRoles,5);
  assert.equal(imported.report.preservedRoles,10);
  assert.equal(imported.report.alphaStripped,1);
});

test('exact AlchLang scope outranks later generic fallback',()=>{
  const theme=JSON.stringify({name:'Exact Base',include:'./parent.json',tokenColors:[
    {scope:'entity.name.type',settings:{foreground:'#00FF00'}},
    {scope:'entity.name.type.reference.alch',settings:{foreground:'#C06A70'}},
    {scope:'keyword.other',settings:{foreground:'#246'}},
    {scope:'source.js',settings:{foreground:'tomato'}}
  ]});
  const imported=client.importThemeBase(theme,model.PRESETS.dark,model.ROLE_DEFINITIONS);
  assert.equal(imported.palette.referenceOperands,'#C06A70');
  assert.equal(imported.palette.types,'#00FF00');
  assert.equal(imported.palette.clauses,'#224466');
  assert.equal(imported.palette.referenceKeywords,'#224466');
  assert.equal(imported.report.includeIgnored,true);
  assert.equal(imported.report.invalidColors,1);
});

test('theme import rejects malformed input and missing local token rules',()=>{
  assert.throws(()=>client.parseThemeJson('{"tokenColors": [}'),/not valid JSON or JSONC/);
  assert.throws(()=>client.parseThemeJson('{"include":".\/base.json"}'),/own tokenColors array/);
  assert.deepEqual(client.normalizeImportedColor('#abcd'),{color:'#AABBCC',alphaStripped:true});
  assert.equal(client.normalizeImportedColor('rgb(1,2,3)'),null);
});

test('apply replaces only AlchLang rules for the selected theme',()=>{
  const current={global:'preserved','[AlchLang Monokai Dimmed]':{comments:'#abcdef',textMateRules:[{name:'User rule',scope:'source.js',settings:{foreground:'#123456'}},{name:'AlchLang custom:strings',scope:'string.quoted.double.alch',settings:{foreground:'#FFFFFF'}}]}};
  const applied=model.applyPalette(current,'AlchLang Monokai Dimmed',model.PRESETS.dark);
  assert.equal(current['[AlchLang Monokai Dimmed]'].textMateRules.length,2,'input remains immutable');
  assert.equal(applied.global,'preserved');
  assert.equal(applied['[AlchLang Monokai Dimmed]'].comments,'#abcdef');
  assert.equal(applied['[AlchLang Monokai Dimmed]'].textMateRules.filter(rule=>rule.name==='User rule').length,1);
  assert.equal(applied['[AlchLang Monokai Dimmed]'].textMateRules.filter(rule=>rule.name.startsWith(model.CUSTOM_RULE_PREFIX)).length,15);
});

test('reset removes only AlchLang rules and prunes an empty theme bucket',()=>{
  const mixed={'[Dark Modern]':{textMateRules:[{name:'User rule',scope:'source.js',settings:{foreground:'#123456'}},{name:'AlchLang custom:strings',scope:'string.quoted.double.alch',settings:{foreground:'#FFFFFF'}}]}};
  assert.deepEqual(model.resetPalette(mixed,'Dark Modern'),{'[Dark Modern]':{textMateRules:[{name:'User rule',scope:'source.js',settings:{foreground:'#123456'}}]}});
  assert.deepEqual(model.resetPalette({'[Dark Modern]':{textMateRules:[mixed['[Dark Modern]'].textMateRules[1]]}},'Dark Modern'),{});
});

test('stored current-theme colors override the appropriate preset',()=>{
  const saved={'[Dark Modern]':{textMateRules:[{name:'AlchLang custom:referenceOperands',scope:'entity.name.type.reference.alch',settings:{foreground:'#AA6670'}}]}};
  const palette=model.paletteFromCustomizations(saved,'Dark Modern',model.PRESETS.dark);
  assert.equal(palette.referenceOperands,'#AA6670');
  assert.equal(palette.strings,model.PRESETS.dark.strings);
});

test('webview page has bounded resources, CSP, labels, and explicit actions',()=>{
  const html=model.getWebviewHtml({cspSource:'vscode-webview:'},'style.css','script.js','fixed-nonce');
  assert.match(html,/default-src 'none'/);
  assert.match(html,/script-src 'nonce-fixed-nonce'/);
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/Apply to this theme/);
  assert.match(html,/Reset this theme/);
  assert.match(html,/Import theme as base/);
  assert.match(html,/Vivid base/);
  assert.match(html,/id="export" type="button">Export theme/);
  assert.match(html,/LIVE TOKEN INSPECTOR/);
  assert.match(html,/id="token-inspector"/);
  assert.match(html,/id="selected-role"/);
  assert.match(html,/id="selected-color"/);
  assert.match(html,/id="selected-picker"/);
  assert.doesNotMatch(html,/id="brightness(?:-value|-reset)?"/);
  assert.doesNotMatch(html,/id="palette-grid"/);
  assert.equal((html.match(/<section class="panel/g)??[]).length,1);
  assert.match(html,/accept="\.json,\.jsonc,application\/json"/);
  assert.doesNotMatch(html,/https?:\/\//);
});

test('one live sample contains the complete interactive color editor',()=>{
  assert.match(configuratorCss,/main\{display:grid;grid-template-columns:1fr/);
  assert.match(configuratorCss,/\.preview-panel\{position:relative\}/);
  assert.match(configuratorCss,/\.preview \[data-role\].*cursor:pointer/);
  assert.match(configuratorCss,/\.token-inspector\{display:grid/);
  assert.doesNotMatch(configuratorCss,/\.brightness-(?:control|adjustment|copy)/);
  assert.equal('adjustBrightness' in client,false);
  assert.equal('adjustPaletteBrightness' in client,false);
  assert.doesNotMatch(configuratorCss,/\.palette-grid|\.color-row/);
  assert.match(configuratorCss,/\.studio-footer\{margin-top:14px/);
});

test('standalone preview uses dimmed fallbacks when VS Code variables are absent',()=>{
  assert.match(configuratorCss,/background:var\(--vscode-editor-background,#181818\)/);
  assert.match(configuratorCss,/background:var\(--vscode-editor-background,#1E1E1E\)/);
  assert.match(configuratorCss,/color:var\(--vscode-editor-foreground,#D4D4D4\)/);
  assert.match(configuratorCss,/var\(--vscode-editorWidget-border,#454545\)/);
  assert.match(configuratorCss,/var\(--vscode-button-secondaryBackground,#3A3D41\)/);
});
