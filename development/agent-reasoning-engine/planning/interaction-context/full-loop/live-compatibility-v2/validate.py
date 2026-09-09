import json,hashlib
from pathlib import Path
import jsonschema
BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[6]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
schemas=json.loads((BASE/'selected-schemas.json').read_text())
observation=json.loads((BASE/'protocol-observation.json').read_text())
assert sha(BASE/'selected-schemas.json')==observation['selected_schema_sha256']
assert sha(BASE/'protocol-projection.json')==observation['selected_projection_sha256']
profile=json.loads((BASE/'canary-profile.json').read_text())
for key in ['interface','protocol_observation','protocol_projection']:
 binding=profile['sources'][key];assert sha(ROOT/binding['path'])==binding['sha256'],key
requests=[{'id':1,'method':'initialize','params':{'clientInfo':{'name':'are-canary','version':'2'},'capabilities':{'experimentalApi':True}}},
 {'id':2,'method':'thread/start','params':{'cwd':'/tmp/are-canary','ephemeral':True,'model':'gpt-5.6-sol','allowProviderModelFallback':False,'approvalPolicy':'never','sandbox':'read-only','baseInstructions':'Text only; no tools.'}},
 {'id':3,'method':'turn/start','params':{'threadId':'test','input':[{'type':'text','text':'Explain context'}],'additionalContext':{'test':{'kind':'application','value':'plain language'}},'approvalPolicy':'never','sandboxPolicy':{'type':'readOnly','networkAccess':False}}}]
for request in requests:jsonschema.Draft7Validator(schemas['client_requests']).validate(request)
for bad in [{'kind':'application','value':{}},{'kind':'unknown','value':'text'}]:
 request=json.loads(json.dumps(requests[-1]));request['params']['additionalContext']['test']=bad
 assert not jsonschema.Draft7Validator(schemas['client_requests']).is_valid(request)
print('PASS: selected-schema closure, exact protocol bindings, canary requests, invalid-context rejection')
