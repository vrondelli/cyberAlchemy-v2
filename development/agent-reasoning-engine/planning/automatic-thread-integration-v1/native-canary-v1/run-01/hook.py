import json,sys,subprocess,os
from pathlib import Path
ROOT=Path(__file__).parent
raw=sys.stdin.read(65537)
event=json.loads(raw)
with (ROOT/'callbacks.jsonl').open('a') as f:f.write(json.dumps({'phase':'input','event':event})+'\n');f.flush();os.fsync(f.fileno())
r=subprocess.run(['/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node','/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/agent-reasoning-engine/planning/automatic-thread-integration-v1/hook-adapter-v1/adapter.mjs',str(ROOT/'binding.json')],input=raw,text=True,capture_output=True,timeout=10)
with (ROOT/'callbacks.jsonl').open('a') as f:f.write(json.dumps({'phase':'output','turn':event.get('turn_id'),'event':event.get('hook_event_name'),'status':r.returncode,'output':r.stdout,'error':r.stderr})+'\n');f.flush();os.fsync(f.fileno())
sys.stdout.write(r.stdout);sys.stderr.write(r.stderr);sys.exit(r.returncode)
