"""Apply the selected quotas to isolated idle probes; no capacity or OOM claim."""
from pathlib import Path
import json, subprocess, time
base=Path(__file__).resolve().parent
spec=json.loads((base/'compose-check.json').read_text())['resource_values']
results=[]
for role, limits in spec.items():
    name='kep-evf-quota-'+role+'-'+str(time.time_ns())
    args=['docker','run','-d','--name',name,'--network','none','--memory',str(limits['mem_limit']),'--memory-swap',str(limits['memswap_limit']),'--cpus',str(limits['cpus']),'--pids-limit',str(limits['pids_limit']),'--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--entrypoint','/bin/sleep','ca2-kep-hosted-devnet:hardening-20260906','120']
    cid=subprocess.check_output(args,text=True).strip()
    try:
        data=json.loads(subprocess.check_output(['docker','inspect',name],text=True))[0];h=data['HostConfig']
        assert data['State']['Running']
        assert h['Memory']==limits['mem_limit'] and h['MemorySwap']==limits['memswap_limit']
        assert h['NanoCpus']==int(limits['cpus']*1_000_000_000) and h['PidsLimit']==limits['pids_limit']
        results.append({'role_budget':role,'container':cid,'Memory':h['Memory'],'MemorySwap':h['MemorySwap'],'NanoCpus':h['NanoCpus'],'PidsLimit':h['PidsLimit'],'verified':True})
    finally: subprocess.run(['docker','stop','--time','3',name],check=True,stdout=subprocess.DEVNULL)
(base/'docker-quotas.json').write_text(json.dumps({'result':'PASS','probes':results,'scope':'Docker applies quotas; idle isolated probes, not application throughput, database tuning or stress evidence'},indent=2)+'\n')
