#!/usr/bin/env python3
"""Independently seal raw and fixed-prefix guarded r44 predictions."""
from __future__ import annotations

import hashlib, json, os, re
from pathlib import Path

BASE=Path('/home/vlad_/are-benchmark-archive/bugswarm-1.3.1-g01-feasibility-20261004/graph-dev-b-r2')
RUN=BASE/'code-only/entity-r44/vps-run'; OUTPUT=BASE/'code-only/entity-r44/predictions'
RANKINGS=BASE/'code-only/graph-r2/GRAPH-RANKINGS-B-R3.jsonl'
PINS={
 'packets':(RUN/'PACKETS.jsonl','e8050018d1bb3ca956ad2d96487cc314c7fb5f35538d333978f214d44286ae02'),
 'packet_seal':(RUN/'PACKET-SEAL.json','6207ed8cbe4b3e812c0becb97b0b2cc2abd12b65cdda34ed8228149b8a068db6'),
 'protocol':(RUN/'TREATMENT-PROTOCOL.md','8009f24043f2e8190ad9af707c0b17a81237b15d6e0e962509f1a63d1372c958'),
 'runner':(RUN/'run-bugswarm-graph-dev-b-r44-vps.py','81272e09bf907ee66fa152ba0a7c079daa1dd954b737e4bb8c03c2784e695c08'),
 'run_freeze':(RUN/'RUN-FREEZE.json','f92dfe0ed142ea60892462117767ee1793f6ebc3a6fcc81830e679e27f4448e1'),
 'run_result':(RUN/'RUN-RESULT.json','1efdf36c9cb40a818965932b6130950c5cce9e84518242414f3ac9613c10e420'),
 'tokenizer_result':(RUN/'TOKENIZER-RESULT.json','1d2476b20b84406409e639f1cb9acafede1f3a80c9a033af4d04d932b9998c56'),
 'graph_rankings':(RANKINGS,'86b39c47e9ce166d4db66068d5894f3e9cbac1275b11d549df1e17ee121cb32d'),
}
sha=lambda data:hashlib.sha256(data).hexdigest()
def need(ok,why):
 if not ok:raise SystemExit(why)
def save(path,data):
 fd=os.open(path,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
 with os.fdopen(fd,'wb') as handle:handle.write(data)
def parse(content,packet):
 need(isinstance(content,str),'content');body=content.strip();fence=re.fullmatch(r'```json\r?\n([\s\S]*?)\r?\n```',body)
 if fence:body=fence.group(1)
 value=json.loads(body);need(isinstance(value,dict) and set(value)=={'candidate_ids'} and isinstance(value['candidate_ids'],list) and len(value['candidate_ids'])<=8,'shape')
 by_path={item['path']:item['candidate_id'] for item in packet['candidates']};ids=[]
 for item in value['candidate_ids']:
  if isinstance(item,int) and not isinstance(item,bool):candidate_id=item
  elif isinstance(item,str) and re.fullmatch(r'[1-9][0-9]*',item):candidate_id=int(item)
  elif isinstance(item,str) and item in by_path:candidate_id=by_path[item]
  else:raise ValueError('selection-value')
  need(1<=candidate_id<=packet['candidate_count'],'range');ids.append(candidate_id)
 need(len(ids)==len(set(ids)),'duplicate');return ids
def main():
 need(not OUTPUT.exists() and all(sha(path.read_bytes())==pin for path,pin in PINS.values()),'output-or-input')
 packets=[json.loads(x) for x in PINS['packets'][0].read_text().splitlines()]
 graphs=[json.loads(x) for x in RANKINGS.read_text().splitlines()]
 run=json.loads(PINS['run_result'][0].read_bytes());tokens=json.loads(PINS['tokenizer_result'][0].read_bytes())
 need(len(packets)==len(graphs)==24 and run['status']=='complete' and run['attempts']==run['valid_responses']==24 and not run['transport_stopped'] and tokens['status']=='admitted' and tokens['admitted']==24,'denominator')
 rows=[];prompt_total=completion_total=token_ms=generation_ms=0
 for packet,graph in zip(packets,graphs):
  ordinal=packet['ordinal'];num=f'{ordinal:02d}';need(graph['ordinal']==ordinal and graph['id']==packet['id'],'identity')
  token_path=RUN/f'TOKENIZER-{num}.json';call_path=RUN/f'GENERATION-{num}.json';decision_path=RUN/f'DECISION-{num}.json'
  td,cd,dd=token_path.read_bytes(),call_path.read_bytes(),decision_path.read_bytes();token,call,decision=map(json.loads,(td,cd,dd))
  need(token['id']==call['id']==decision['id']==packet['id'] and token['prompt_sha256']==call['prompt_sha256']==sha(packet['prompt'].encode()) and token['admitted'] is True and token['http_status']==200 and call['http_status']==200 and call['failure_code'] is None and call['finish_reason']=='stop','receipt')
  usage=call['usage'];need(usage['prompt_tokens']==token['prompt_tokens'] and isinstance(usage['completion_tokens'],int),'usage')
  ids=parse(call['provider_payload']['choices'][0]['message']['content'],packet);selected=[packet['candidates'][i-1]['path'] for i in ids]
  need(decision['listwise_valid'] is True and decision['selected_ids']==ids and decision['selected_paths']==selected,'decision')
  seen=set(selected);raw=selected+[path for path in graph['ranked_files'] if path not in seen]
  prefix=graph['ranked_files'][:4];guarded_selected=[path for path in selected if path not in set(prefix)];guard_seen=set(prefix+guarded_selected)
  guarded=prefix+guarded_selected+[path for path in graph['ranked_files'] if path not in guard_seen]
  n=packet['candidate_count']
  need(len(raw)==len(guarded)==len(graph['ranked_files']) and len(set(raw))==len(set(guarded))==len(raw) and set(raw)==set(guarded)==set(graph['ranked_files']) and set(raw[:n])==set(guarded[:n])==set(graph['ranked_files'][:n]),'coverage')
  rows.append({'schema_version':'are.g01-r44-prediction/v1','ordinal':ordinal,'id':packet['id'],'repo':packet['repo'],'language':packet['language'],'base_commit':packet['base_commit'],'graph_rankings_sha256':PINS['graph_rankings'][1],'tokenizer_sha256':sha(td),'call_sha256':sha(cd),'decision_sha256':sha(dd),'valid':True,'selected_ids':ids,'selected_paths':selected,'raw_ranked_files':raw,'guarded_ranked_files':guarded,'candidate_count':len(raw),'preserved_top_n':n,'raw_top_n_set_preserved':True,'guarded_top_n_set_preserved':True,'fixed_graph_prefix':4,'gold_opened':False})
  prompt_total+=usage['prompt_tokens'];completion_total+=usage['completion_tokens'];token_ms+=token['elapsed_ms'];generation_ms+=call['elapsed_ms']
 need(prompt_total==run['known_prompt_tokens']==tokens['summed_prompt_tokens'] and completion_total==run['known_completion_tokens'] and token_ms==tokens['summed_elapsed_ms'] and generation_ms==run['summed_elapsed_ms'],'accounting')
 data=''.join(json.dumps(row,sort_keys=True)+'\n' for row in rows).encode();seal={'schema_version':'are.g01-r44-prediction-seal/v1','input_sha256':{name:pin for name,(_,pin) in PINS.items()},'script_sha256':sha(Path(__file__).read_bytes()),'cases':24,'valid':24,'raw_top_n_set_preserved':24,'guarded_top_n_set_preserved':24,'fixed_graph_prefix':4,'known_prompt_tokens':prompt_total,'known_completion_tokens':completion_total,'summed_tokenizer_elapsed_ms':token_ms,'summed_generation_elapsed_ms':generation_ms,'predictions_sha256':sha(data),'gold_opened':False}
 seal_data=(json.dumps(seal,sort_keys=True,indent=2)+'\n').encode();OUTPUT.mkdir(mode=0o700);save(OUTPUT/'PREDICTIONS.jsonl',data);save(OUTPUT/'PREDICTION-SEAL.json',seal_data);print(json.dumps({**seal,'seal_sha256':sha(seal_data)},sort_keys=True))
if __name__=='__main__':main()
