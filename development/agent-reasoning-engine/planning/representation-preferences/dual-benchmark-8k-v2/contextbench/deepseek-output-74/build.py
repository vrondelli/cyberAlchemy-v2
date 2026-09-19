"""Deterministic isolated derivation. Open questions: PLAN.md."""
from pathlib import Path
import json,hashlib,tarfile
HERE=Path(__file__).resolve().parent;ROOT=HERE/'snapshot';ROOT.mkdir()
with tarfile.open(HERE/'pristine-source.tar.gz')as t:t.extractall(ROOT,filter='data')
C=ROOT/'development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench'
changes=[]
def edit(name,replacements):
 p=C/name;before=p.read_bytes();s=before.decode()
 for old,new in replacements:
  assert old in s,(name,old);s=s.replace(old,new)
 p.write_text(s);changes.append({'path':str(p.relative_to(ROOT)),'before':hashlib.sha256(before).hexdigest(),'after':hashlib.sha256(p.read_bytes()).hexdigest()})
edit('deepseek-full-window-profile.mjs',[("glm-full-window-73","glm-output-74"),('output_cap:2048','output_cap:8192')])
edit('deepseek-pilot-are-worker.mjs',[('maximum_output_tokens:2048','maximum_output_tokens:cell.limits.output_cap'),('maximum_request_bytes:full?FULL_WINDOW.maximum_request_bytes:262144','maximum_request_bytes:full?FULL_WINDOW.maximum_request_bytes:262144,maximum_response_bytes:full?1048576:262144')])
edit('packet-diversity-v1/transport-bounded-v3.mjs',[
 ('maximum_output_tokens <= 2048',"maximum_output_tokens <= (request_budget==='contextbench-full-window-v1'?8192:2048)"),
 ('maximum_response_bytes <= 262144',"maximum_response_bytes <= (request_budget==='contextbench-full-window-v1'?1048576:262144)"),
 ("if (finish_reason === 'tool_calls') need(Array.isArray(message.tool_calls) && message.tool_calls.length > 0 && message.tool_calls.length <= 8, 'tool-calls-invalid');", "if (finish_reason === 'tool_calls') {\n        const valid=Array.isArray(message.tool_calls)&&message.tool_calls.length>0&&message.tool_calls.length<=8;\n        if(!valid)receipt.tool_call_shape={present:Object.hasOwn(message,'tool_calls'),is_array:Array.isArray(message.tool_calls),count:Array.isArray(message.tool_calls)?message.tool_calls.length:null};\n        need(valid,'tool-calls-invalid');\n      }")])
edit('deepseek-durable-transport.mjs',[('const MAX_BYTES=2*1024**2;','const MAX_BYTES=16*1024**2;')])
edit('deepseek-wire-export.mjs',[('Buffer.byteLength(bytes)<=2097152','Buffer.byteLength(bytes)<=16*1024**2')])
p=ROOT/'PILOT-CONFIG.json';config=json.loads(p.read_text());config['full_window_profile']='glm-output-74';config['experiment_id']='glm-output-74';p.write_text(json.dumps(config,indent=2))
p=ROOT/'profile-template.patch.yml';p.write_text(p.read_text().replace('2048','8192'))
(HERE/'DERIVATION.json').write_text(json.dumps({'parent_run':'full-window-73','changes':changes,'output_cap_before':2048,'output_cap_after':8192,'recovery_policy_changed':False,'open_questions_ref':'PLAN.md'},indent=2))
print('Derived',len(changes),'isolated source changes')
