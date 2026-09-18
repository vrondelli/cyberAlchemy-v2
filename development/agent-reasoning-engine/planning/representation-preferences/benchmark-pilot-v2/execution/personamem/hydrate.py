"""Stream pinned CSV; retain selected rows and complete 32K histories only."""
import ast,csv,hashlib,json,re,urllib.request,pathlib,shutil
ROOT=pathlib.Path(__file__).resolve().parent
REV='ed956dea41521fc4499acbc63f966e0fd3c053ba'
BASE=f'https://huggingface.co/datasets/bowen-upenn/PersonaMem-v2/resolve/{REV}/'
EXPECTED='95f2a8a324aab7baf2af937feae12731369e2abf7cad5ab3e170594cb25a3e52'
def sha(b): return hashlib.sha256(b).hexdigest()
def write(p,v): p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def run():
 if shutil.disk_usage(ROOT).free<2*1024**3: raise RuntimeError('disk floor')
 h=hashlib.sha256(); transferred=0
 def lines(response):
  nonlocal transferred
  for b in response:
   transferred+=len(b)
   if transferred>64*1024**2: raise RuntimeError('CSV transfer cap')
   h.update(b); yield b.decode('utf-8')
 counts={}; selected=[]; personas=set()
 forget=re.compile(r"(?:do not|don't|don’t|please don’t|please don't)\s+(?:remember|save|store|retain)|forget\s+(?:this|that)|not\s+(?:remember|save|store)\s+(?:this|that)",re.I)
 with urllib.request.urlopen(BASE+'benchmark/text/benchmark.csv') as response:
  rows=csv.DictReader(lines(response))
  for index,row in enumerate(rows):
   snippet=json.loads(row['related_conversation_snippet'])
   matches=[m['content'] for m in snippet if m['role']=='user' and forget.search(m['content'])]
   if matches: stratum='do-not-remember'
   elif row['who']!='self': stratum='other-person-attribution'
   elif row['updated']=='True': stratum='preference-update'
   else: stratum='implicit-preference'
   counts[stratum]=counts.get(stratum,0)+1
   have=sum(s['stratum']==stratum for s in selected)
   if have>=2 or row['persona_id'] in personas: continue
   personas.add(row['persona_id'])
   selected.append({'task_id':f'personamem:benchmark-text-row-{index}', 'source_row_index':index,'persona_id':row['persona_id'],'split':'development' if have==0 else 'reserved','stratum':stratum,'row':row,'do_not_remember_grounding':matches})
 if h.hexdigest()!=EXPECTED: raise RuntimeError('upstream CSV drift')
 records=[]
 for s in selected:
  row=s.pop('row'); raw=json.dumps(row,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
  path=row['chat_history_32k_link']; b=urllib.request.urlopen(BASE+path).read(2*1024**2)
  history=json.loads(b); query=ast.literal_eval(row['user_query'])
  id=s['task_id'].split(':')[1]
  s.update({'revision':REV,'csv_sha256':h.hexdigest(),'record_canonical_sha256':sha(raw),'history_source_path':path,'history_sha256':sha(b),'upstream_token_count':int(row['total_tokens_in_chat_history_32k']),'source_url':BASE+'benchmark/text/benchmark.csv'})
  (ROOT/'source').mkdir(exist_ok=True); (ROOT/'source'/f'{id}.history.json').write_bytes(b)
  write(ROOT/'source'/f'{id}.row.json',row)
  write(ROOT/'visible'/f'{id}.json',{'task_id':s['task_id'],'history':history,'query':query})
  write(ROOT/'evaluator'/f'{id}.json',{'task_id':s['task_id'],'correct_answer':row['correct_answer'],'incorrect_answers':ast.literal_eval(row['incorrect_answers']),'preference':row['preference'],'who':row['who'],'updated':row['updated'],'previous_preference':row['prev_pref'],'related_conversation_snippet':json.loads(row['related_conversation_snippet'])})
  s['visible_sha256']=sha((ROOT/'visible'/f'{id}.json').read_bytes())
  records.append(s)
 write(ROOT/'selection.json',{'schema_version':'are.personamem-selection/v1','revision':REV,'license':'CC-BY-4.0','selection_policy':'stream source order, at most two per mutually exclusive stratum, distinct persona across all rows; do-not-remember then other then update then implicit priority','source_counts':counts,'csv_bytes_streamed':transferred,'csv_sha256':h.hexdigest(),'tasks':records,'gaps':[x for x in ['implicit-preference','preference-update','other-person-attribution','do-not-remember'] if sum(t['stratum']==x for t in records)!=2],'authority_effect':'none'})
 print(json.dumps({'selected':len(records),'counts':counts,'upstream_tokens':[(x['task_id'],x['upstream_token_count']) for x in records],'retained_bytes':sum(p.stat().st_size for p in ROOT.rglob('*') if p.is_file())},indent=2))
if __name__=='__main__':run()
