"""Rebuild the candidate lexical inventory. Limitations and open questions: README.md."""
import pathlib,json,re,hashlib
root=pathlib.Path(__file__).resolve().parents[2]; base=root/'implementation/agent-reasoning-engine'; out=root/'research/are-documentation-v1'
dirs=[base/'packages'/d.name for d in (base/'packages').iterdir() if d.is_dir()]
dirs += [base/'benchmarks/real-reasoning-v1',base/'src',base/'bin',root/'implementation/define-cli',root/'agent-routing/capabilities/are-cli']
skip={'node_modules','target','.runtime','research','evidence','receipts','generated','fixtures','test','tests','planning','runs','__pycache__'}
files=set()
for d in dirs:
 for p in d.rglob('*'):
  if not p.is_file() or any(v in skip for v in p.relative_to(d).parts) or p.name.endswith('.test.mjs'):continue
  if p.suffix in {'.mjs','.js','.json'}:files.add(p)
records=[]
for p in sorted(files):
 text=p.read_text(errors='replace');rel=str(p.relative_to(root))
 module=p.relative_to(base/'packages').parts[0] if p.is_relative_to(base/'packages') else ('define-cli' if 'implementation/define-cli/' in rel else 'product')
 page='reference/modules/'+module+'.md'
 exports=[]
 for m in re.finditer(r'\bexport\s+(?:(?:async\s+)?function\s*\*?\s*|class\s+|const\s+|let\s+|var\s+)([A-Za-z_$][\w$]*)|\bexport\s*\{([^}]+)\}|\bexport\s+(\*|default)\b',text,re.S):
  exports.append({'line':text[:m.start()].count('\n')+1,'declaration':re.sub(r'\s+',' ',m.group(0))[:1500]})
 flags=sorted(set(re.findall(r'(?<!\w)--[a-z][a-z0-9-]+',text))) if '/bin/' in rel or p.name=='cli.mjs' else []
 props=[]
 if p.suffix=='.json' and ('schema' in p.name or '/profiles/' in rel):
  try:
   obj=json.loads(text)
   def walk(v,path=''):
    if isinstance(v,dict):
     for k,val in v.items():
      loc=path+'/'+k.replace('~','~0').replace('/','~1')
      if k=='properties' and isinstance(val,dict):
       for name in val:props.append(loc+'/'+name.replace('~','~0').replace('/','~1'))
      walk(val,loc)
    elif isinstance(v,list):
     for i,val in enumerate(v):walk(val,path+'/'+str(i))
   walk(obj)
   if '/profiles/' in rel:props+=['/'+k for k in obj]
  except ValueError:pass
 if exports or flags or props:
  records.append({'source':rel,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'module':module,'planned_page':page,'disposition':'candidate-reference-discovery-needs-public-internal-classification','export_declarations':exports,'cli_flag_candidates':flags,'schema_or_profile_pointers':props})
x={'schema_version':'are.documentation-source-surface-discovery/v1','status':'candidate','method':'static textual discovery, not AST/public API certification','scope':'package source plus product src/bin, real-reasoning, Define integration and decision CLI; excluded tests, fixtures, generated, research, run evidence, build outputs','limitations':['Export matches may include strings/comments; export-star targets not expanded.','Flags are textual candidates, not validated CLI contracts.','JSON pointers identify schema properties or top-level profile keys, not all runtime schema behavior.','Source record presence is not a promise of supported public API.'],'counts':{'scanned_files':len(files),'indexed_files':len(records),'export_declarations':sum(len(r['export_declarations']) for r in records),'cli_flag_candidates':sum(len(r['cli_flag_candidates']) for r in records),'schema_or_profile_pointers':sum(len(r['schema_or_profile_pointers']) for r in records)},'records':records,'open_questions':['Which discovered items are supported public interfaces versus internal mechanisms?']}
(out/'source-surfaces.json').write_text(json.dumps(x,indent=2)+'\n')
print(x['counts'])
