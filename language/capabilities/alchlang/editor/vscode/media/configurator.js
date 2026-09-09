'use strict';

const normalize=value=>/^#[0-9a-f]{6}$/i.test(value)?value.toUpperCase():null;
const parseRgb=value=>{
  if(Array.isArray(value))return value.slice(0,3).map(Number);
  const match=String(value).match(/[\d.]+/g);
  return match?.slice(0,3).map(Number)??[30,30,30];
};
const hexToRgb=hex=>[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16));
const rgbToHex=rgb=>`#${rgb.map(channel=>Math.max(0,Math.min(255,Math.round(channel))).toString(16).padStart(2,'0')).join('')}`.toUpperCase();
const luminance=rgb=>parseRgb(rgb).map(channel=>channel/255).map(channel=>channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
const contrast=(foreground,background)=>{
  const foregroundLuminance=luminance(foreground),backgroundLuminance=luminance(background);
  return (Math.max(foregroundLuminance,backgroundLuminance)+0.05)/(Math.min(foregroundLuminance,backgroundLuminance)+0.05);
};

const isRecord=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);

const GENERIC_SCOPE_HINTS=Object.freeze({
  comments:['comment'],
  strings:['string'],
  declarations:['storage.type','storage.modifier'],
  control:['keyword.control'],
  clauses:['keyword.other'],
  referenceKeywords:['keyword.other'],
  referenceOperands:['entity.name.type','variable.other'],
  types:['entity.name.type','support.type'],
  callables:['entity.name.function','support.function'],
  variables:['variable.other','variable'],
  symbols:['constant.other'],
  languageConstants:['constant.language'],
  numbers:['constant.numeric'],
  operators:['keyword.operator'],
  punctuation:['punctuation']
});

function stripJsonComments(text){
  let result='',inString=false,escaped=false,lineComment=false,blockComment=false;
  for(let index=0;index<text.length;index+=1){
    const current=text[index],next=text[index+1];
    if(lineComment){
      if(current==='\n'||current==='\r'){lineComment=false;result+=current;}else result+=' ';
      continue;
    }
    if(blockComment){
      if(current==='*'&&next==='/'){result+='  ';index+=1;blockComment=false;}
      else result+=current==='\n'||current==='\r'?current:' ';
      continue;
    }
    if(inString){
      result+=current;
      if(escaped)escaped=false;
      else if(current==='\\')escaped=true;
      else if(current==='"')inString=false;
      continue;
    }
    if(current==='"'){inString=true;result+=current;}
    else if(current==='/'&&next==='/'){result+='  ';index+=1;lineComment=true;}
    else if(current==='/'&&next==='*'){result+='  ';index+=1;blockComment=true;}
    else result+=current;
  }
  return result;
}

function stripTrailingCommas(text){
  let result='',inString=false,escaped=false;
  for(let index=0;index<text.length;index+=1){
    const current=text[index];
    if(inString){
      result+=current;
      if(escaped)escaped=false;
      else if(current==='\\')escaped=true;
      else if(current==='"')inString=false;
      continue;
    }
    if(current==='"'){inString=true;result+=current;continue;}
    if(current===','){
      let cursor=index+1;
      while(/\s/.test(text[cursor]??''))cursor+=1;
      if(text[cursor]===']'||text[cursor]==='}')continue;
    }
    result+=current;
  }
  return result;
}

function parseThemeJson(text){
  if(typeof text!=='string')throw new TypeError('Theme contents must be text.');
  let theme;
  try{theme=JSON.parse(stripTrailingCommas(stripJsonComments(text.replace(/^\uFEFF/,''))));}
  catch(error){throw new SyntaxError(`Theme is not valid JSON or JSONC: ${error.message}`);}
  if(!isRecord(theme))throw new TypeError('Theme root must be a JSON object.');
  if(!Array.isArray(theme.tokenColors))throw new TypeError('Theme must contain its own tokenColors array. Included theme files are not resolved.');
  return theme;
}

function normalizeImportedColor(value){
  if(typeof value!=='string')return null;
  const color=value.trim();
  if(/^#[0-9a-f]{3}$/i.test(color))return {color:`#${[...color.slice(1)].map(channel=>channel.repeat(2)).join('')}`.toUpperCase(),alphaStripped:false};
  if(/^#[0-9a-f]{4}$/i.test(color))return {color:`#${[...color.slice(1,4)].map(channel=>channel.repeat(2)).join('')}`.toUpperCase(),alphaStripped:true};
  if(/^#[0-9a-f]{6}$/i.test(color))return {color:color.toUpperCase(),alphaStripped:false};
  if(/^#[0-9a-f]{8}$/i.test(color))return {color:color.slice(0,7).toUpperCase(),alphaStripped:true};
  return null;
}

function scopeList(value){
  const values=Array.isArray(value)?value:[value];
  return values.filter(item=>typeof item==='string').flatMap(item=>item.split(',')).map(item=>item.trim()).filter(Boolean);
}

function scopeScore(selector,role){
  const atoms=selector.split(/\s+/).map(atom=>atom.trim()).filter(Boolean);
  let score=0;
  for(const atom of atoms){
    if(role.scopes.includes(atom)){score=Math.max(score,100000+atom.length);continue;}
    if(atom.endsWith('.alch'))continue;
    for(const [index,hint] of (GENERIC_SCOPE_HINTS[role.id]??[]).entries()){
      if(atom===hint||atom.startsWith(`${hint}.`))score=Math.max(score,1000-index*10+hint.length);
    }
  }
  return score;
}

function importThemeBase(text,currentPalette,roles,fileName='theme.json'){
  const theme=parseThemeJson(text),palette={...currentPalette},selected=new Map();
  let invalidColors=0,alphaStripped=0;
  theme.tokenColors.forEach((rule,ruleIndex)=>{
    const normalized=normalizeImportedColor(rule?.settings?.foreground);
    if(!normalized){if(rule?.settings&&Object.hasOwn(rule.settings,'foreground'))invalidColors+=1;return;}
    if(normalized.alphaStripped)alphaStripped+=1;
    for(const selector of scopeList(rule.scope))for(const role of roles){
      const score=scopeScore(selector,role),previous=selected.get(role.id);
      if(score&&(previous===undefined||score>previous.score||(score===previous.score&&ruleIndex>=previous.ruleIndex))){
        selected.set(role.id,{score,ruleIndex,color:normalized.color});
      }
    }
  });
  for(const [roleId,choice] of selected)palette[roleId]=choice.color;
  const name=typeof theme.name==='string'&&theme.name.trim()?theme.name.trim():fileName.replace(/\.(?:jsonc?|code-workspace)$/i,'');
  return {palette,report:{name,matchedRoles:selected.size,preservedRoles:roles.length-selected.size,invalidColors,alphaStripped,includeIgnored:typeof theme.include==='string'&&theme.include.length>0}};
}

function settingsDocument(themeName,palette,roles){
  const key=`[${String(themeName||'Current Theme').replace(/[\[\]]/g,'')}]`;
  return {'editor.tokenColorCustomizations':{[key]:{textMateRules:roles.map(role=>({name:`AlchLang custom:${role.id}`,scope:role.scopes.length===1?role.scopes[0]:[...role.scopes],settings:{foreground:normalize(palette[role.id])||palette[role.id]}}))}}};
}

function browserThemeDocument(themeName,themeType,palette,roles,background,foreground){
  const type=themeType==='light'?'light':'dark';
  return {$schema:'vscode://schemas/color-theme',name:`${String(themeName||'Current Theme').replace(/[\r\n]+/g,' ').trim()} — AlchLang Custom`,type,colors:{'editor.background':normalize(background)||(type==='light'?'#FFFFFF':'#1E1E1E'),'editor.foreground':normalize(foreground)||(type==='light'?'#1F1F1F':'#D4D4D4')},tokenColors:roles.map(role=>({name:`AlchLang custom:${role.id}`,scope:role.scopes.length===1?role.scopes[0]:[...role.scopes],settings:{foreground:normalize(palette[role.id])||palette[role.id]}}))};
}

const safeFileName=value=>`${String(value||'alchlang').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'alchlang'}-alchlang-color-theme.json`;

function downloadJson(fileName,themeDocument){
  const url=URL.createObjectURL(new Blob([`${JSON.stringify(themeDocument,null,2)}\n`],{type:'application/json'})),link=document.createElement('a');
  link.href=url;link.download=fileName;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
}

async function copyText(text){
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}
  const field=document.createElement('textarea');field.value=text;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();if(!copied)throw new Error('Clipboard access is unavailable in this browser.');
}

function startConfigurator(){
  const vscode=acquireVsCodeApi();
  const preview=document.getElementById('preview');
  const themeName=document.getElementById('theme-name');
  const summary=document.getElementById('quality-summary');
  const status=document.getElementById('status');
  const baseStatus=document.getElementById('base-status');
  const fileInput=document.getElementById('theme-file');
  const applyButton=document.getElementById('apply');
  const selectedToken=document.getElementById('selected-token');
  const selectedRole=document.getElementById('selected-role');
  const selectedColor=document.getElementById('selected-color');
  const selectedPicker=document.getElementById('selected-picker');
  const selectedContrast=document.getElementById('selected-contrast');
  const exportButton=document.getElementById('export');
  const copyButton=document.getElementById('copy');
  const resetButton=document.getElementById('reset');
  const saveNote=document.getElementById('save-note');
  const standalone=/^https?:$/.test(window.location.protocol);
  let state={roles:[],palette:{},initialPalette:{},themeType:'dark',presets:{},distinctions:[]};
  let selectedTokenElement=null;

  function announce(message,kind='ok'){
    status.textContent=message;
    status.dataset.kind=kind;
  }

  function backgroundChannels(){
    return parseRgb(getComputedStyle(preview).backgroundColor);
  }

  const computedHex=property=>rgbToHex(parseRgb(getComputedStyle(preview)[property]));

  function updateInspector(){
    const role=state.roles.find(candidate=>candidate.id===selectedTokenElement?.dataset.role);
    if(!role){
      selectedToken.textContent='Choose a colored word above';selectedRole.textContent='—';selectedColor.value='';selectedColor.disabled=true;selectedPicker.value='#808080';selectedPicker.disabled=true;selectedContrast.textContent='';delete selectedContrast.dataset.level;
      return;
    }
    const color=normalize(state.palette[role.id]);
    selectedToken.textContent=selectedTokenElement.textContent.trim();selectedRole.textContent=role.label;selectedColor.value=state.palette[role.id];selectedColor.disabled=false;selectedPicker.disabled=false;
    if(color){
      selectedPicker.value=color;const ratio=contrast(hexToRgb(color),backgroundChannels());selectedContrast.textContent=`${ratio.toFixed(2)}:1`;selectedContrast.dataset.level=ratio>=4.5?'good':'warn';
    }else{selectedContrast.textContent='Invalid';selectedContrast.dataset.level='bad';}
  }

  function selectToken(token){
    selectedTokenElement?.classList.remove('is-selected');selectedTokenElement?.setAttribute('aria-pressed','false');
    selectedTokenElement=token;selectedTokenElement.classList.add('is-selected');selectedTokenElement.setAttribute('aria-pressed','true');updateInspector();
  }

  function updateQuality(){
    const background=backgroundChannels();
    let invalid=0,lowContrast=0;
    for(const role of state.roles){
      const color=normalize(state.palette[role.id]);
      if(!color){invalid+=1;continue;}
      const ratio=contrast(hexToRgb(color),background);
      if(ratio<4.5)lowContrast+=1;
    }
    const collisions=state.distinctions.filter(([left,right])=>normalize(state.palette[left])===normalize(state.palette[right]));
    const parts=[invalid?`${invalid} invalid ${invalid===1?'color':'colors'}`:'all colors valid',lowContrast?`${lowContrast} below 4.5:1`:'contrast checks pass',collisions.length?`${collisions.length} semantic ${collisions.length===1?'collision':'collisions'}`:'key roles remain distinct'];
    summary.textContent=parts.join(' · ');
    summary.dataset.level=invalid?'bad':lowContrast||collisions.length?'warn':'good';
    applyButton.disabled=standalone||Boolean(invalid);
  }

  function adoptPaletteBase(palette){
    state.palette={...palette};render();
  }

  function setRoleColor(id,value){
    const color=normalize(value);
    state.palette[id]=value;
    for(const token of preview.querySelectorAll(`[data-role="${id}"]`))token.style.color=color||'';
    if(selectedTokenElement?.dataset.role===id)updateInspector();
    updateQuality();
  }

  function render(){
    themeName.textContent=state.themeName;
    for(const role of state.roles)for(const token of preview.querySelectorAll(`[data-role="${role.id}"]`))token.style.color=normalize(state.palette[role.id])||'';
    updateInspector();updateQuality();
  }

  function describeBase(message){baseStatus.textContent=message;}

  preview.addEventListener('click',event=>{
    const token=event.target.closest('[data-role]');
    if(token&&preview.contains(token))selectToken(token);
  });
  preview.addEventListener('keydown',event=>{
    const token=event.target.closest('[data-role]');
    if(token&&preview.contains(token)&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectToken(token);}
  });
  selectedPicker.addEventListener('input',()=>{
    const roleId=selectedTokenElement?.dataset.role;if(roleId)setRoleColor(roleId,selectedPicker.value.toUpperCase());
  });
  selectedColor.addEventListener('input',()=>{
    const roleId=selectedTokenElement?.dataset.role;if(roleId)setRoleColor(roleId,selectedColor.value);
  });
  for(const button of document.querySelectorAll('[data-preset]'))button.addEventListener('click',()=>{
    adoptPaletteBase(state.presets[button.dataset.preset]);describeBase(`${button.textContent} is the editable base.`);announce(`${button.textContent} loaded. Apply when ready.`);
  });
  document.getElementById('import-theme').addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',async()=>{
    const file=fileInput.files?.[0];
    if(!file)return;
    try{
      const imported=importThemeBase(await file.text(),state.palette,state.roles,file.name);
      adoptPaletteBase(imported.palette);
      const report=imported.report,notes=[];
      if(report.includeIgnored)notes.push('include ignored');
      if(report.alphaStripped)notes.push(`${report.alphaStripped} alpha ${report.alphaStripped===1?'channel':'channels'} removed`);
      if(report.invalidColors)notes.push(`${report.invalidColors} invalid ${report.invalidColors===1?'color':'colors'} ignored`);
      describeBase(`${report.name}: ${report.matchedRoles} of ${state.roles.length} roles mapped; ${report.preservedRoles} kept from the previous base${notes.length?`; ${notes.join('; ')}`:''}.`);
      announce(`Loaded ${report.name} as an editable base. Nothing was applied to settings.`);
    }catch(error){announce(error instanceof Error?error.message:String(error),'bad');}
    finally{fileInput.value='';}
  });
  applyButton.addEventListener('click',()=>vscode.postMessage({type:'apply',palette:state.palette}));
  exportButton.addEventListener('click',()=>{
    const background=computedHex('backgroundColor'),foreground=computedHex('color');
    if(standalone){const theme=browserThemeDocument(state.themeName,state.themeType,state.palette,state.roles,background,foreground);downloadJson(safeFileName(state.themeName),theme);announce(`Exported ${theme.name}.`);}
    else vscode.postMessage({type:'export',palette:state.palette,background,foreground});
  });
  resetButton.addEventListener('click',()=>{
    if(standalone){adoptPaletteBase(state.initialPalette);describeBase('The original preview palette is the editable base.');announce('Preview colors reset.');}
    else vscode.postMessage({type:'reset'});
  });
  copyButton.addEventListener('click',async()=>{
    if(!standalone){vscode.postMessage({type:'copy',palette:state.palette});return;}
    try{await copyText(JSON.stringify(settingsDocument(state.themeName,state.palette,state.roles),null,2));announce('Copied settings JSON to the clipboard.');}
    catch(error){announce(error instanceof Error?error.message:String(error),'bad');}
  });
  window.addEventListener('message',event=>{
    const message=event.data;
    if(message?.type==='state'){
      state={themeName:message.themeName,themeType:message.themeType==='light'?'light':'dark',roles:message.roles,palette:{...message.palette},initialPalette:{...message.palette},presets:message.presets,distinctions:message.distinctions};
      for(const token of preview.querySelectorAll('[data-role]')){
        const role=state.roles.find(candidate=>candidate.id===token.dataset.role);
        token.tabIndex=0;token.setAttribute('role','button');token.setAttribute('aria-pressed',token===selectedTokenElement?'true':'false');token.setAttribute('aria-label',`${token.textContent.trim()}: ${role?.label??token.dataset.role}`);
      }
      if(standalone){applyButton.disabled=true;applyButton.textContent='Apply in VS Code';applyButton.title='Open Color Studio inside VS Code to write User Settings.';resetButton.textContent='Reset preview';saveNote.textContent='Export and Copy work here. Applying settings requires Color Studio inside VS Code.';}
      render();updateInspector();describeBase('Current theme settings are the editable base.');
    }
    else if(message?.type==='saved')announce(message.message);
    else if(message?.type==='error')announce(message.message,'bad');
  });
  window.addEventListener('load',()=>vscode.postMessage({type:'ready'}));
}

if(typeof module==='object'&&module.exports)module.exports={normalize,parseRgb,hexToRgb,rgbToHex,luminance,contrast,stripJsonComments,stripTrailingCommas,parseThemeJson,normalizeImportedColor,scopeList,scopeScore,importThemeBase,settingsDocument,browserThemeDocument,safeFileName,GENERIC_SCOPE_HINTS};
if(typeof acquireVsCodeApi==='function')startConfigurator();
