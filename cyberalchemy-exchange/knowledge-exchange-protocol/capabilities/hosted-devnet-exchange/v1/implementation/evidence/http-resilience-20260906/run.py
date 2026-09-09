"""Bounded loopback-only HTTP trial; stop only the server/client processes created here."""
import hashlib,json,os,re,signal,socket,subprocess,threading,time,urllib.request
from pathlib import Path
base=Path(__file__).resolve().parent;root=base.parents[1]
match=re.search(r'Executable .*\((target/release/deps/http_resilience-[a-f0-9]+)\)',(base/'build.txt').read_text())
if not match:raise SystemExit('Successful release harness build required')
client_binary=root/match.group(1);server_binary=root/'target/release/hosted'
(base/'binaries.json').write_text(json.dumps({str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (client_binary,server_binary)},indent=2)+'\n')
results=[]
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
for trial, scenario in enumerate(["bounded_soak", "slow_readers_disconnect_recovery"], 1):
    database=f'kep_resilience_{time.time_ns()}_{trial}'
    subprocess.run(['docker','exec','kep-ux-review-20260906','createdb','-U','postgres',database],check=True)
    with socket.socket() as probe:
        probe.bind(('127.0.0.1',0));port=probe.getsockname()[1]
    url=f'http://127.0.0.1:{port}';database_url=f'postgres://postgres@127.0.0.1:32773/{database}'
    env=dict(os.environ,CA2_KEP_BIND=f'127.0.0.1:{port}',CA2_KEP_DATABASE_URL=database_url,CA2_KEP_DEVNET_RPC_URL='http://127.0.0.1:9')
    samples=[];phase={'name':'startup'};stop=threading.Event();began=time.monotonic();client=None
    server_log=open(base/f'server-{trial}.txt','w')
    (base/f'target-{trial}.json').write_text(json.dumps(dict(database=database,url=url,scenario=scenario),indent=2)+'\n')
    server=subprocess.Popen([str(server_binary)],cwd=root,env=env,stdout=server_log,stderr=subprocess.STDOUT)
    def sample():
        while not stop.is_set():
            try:
                lines=Path(f'/proc/{server.pid}/status').read_text().splitlines()
                values={line.split(':',1)[0]:int(line.split()[1]) for line in lines if line.startswith(('VmRSS:','VmHWM:'))}
                if 'VmRSS' in values:samples.append(dict(seconds=time.monotonic()-began,phase=phase['name'],**values))
            except FileNotFoundError:break
            stop.wait(0.05)
    sampler=threading.Thread(target=sample);sampler.start()
    try:
        for _ in range(100):
            if server.poll() is not None:raise RuntimeError('server exited before readiness')
            try:
                with opener.open(url+'/ready',timeout=1) as response:
                    if response.status==200:break
            except Exception:pass
            time.sleep(0.1)
        else:raise RuntimeError('server readiness timed out')
        phase['name']='uploads';client_env=dict(os.environ,KEP_HTTP_LOAD_URL=url,CA2_KEP_LOAD_TEST_DATABASE_URL=database_url)
        client=subprocess.Popen([str(client_binary),scenario,'--exact','--ignored','--nocapture','--test-threads=1'],cwd=root,env=client_env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
        output=[]
        def read_output():
            with open(base/f'client-{trial}.txt','w') as log:
                for line in client.stdout:
                    log.write(line);log.flush();output.append(line)
                    if 'HTTP_PHASE ' in line:
                        marker=line.split('HTTP_PHASE ',1)[1].strip()
                        phase['name']=marker
                        print(f'{scenario}: {marker}',flush=True)
        reader=threading.Thread(target=read_output);reader.start()
        code=client.wait(timeout=360);reader.join(timeout=5)
        result=json.loads(next(line.split('HTTP_RESULT ',1)[1] for line in output if 'HTTP_RESULT ' in line))
        result.update(exit_code=code,trial=trial,database=database,url=url,server_pid=server.pid,server_peak_kib=max(s['VmHWM'] for s in samples),idle_rss_kib=samples[-1]['VmRSS'])
        results.append(result)
        (base/'results.json').write_text(json.dumps(results,indent=2)+'\n')
        print(f'trial {trial} exit={code}; server peak {result["server_peak_kib"]/1024:.1f} MiB; idle RSS {result["idle_rss_kib"]/1024:.1f} MiB',flush=True)
    finally:
        if client is not None and client.poll() is None:
            client.terminate()
            try:client.wait(timeout=5)
            except subprocess.TimeoutExpired:client.kill();client.wait()
        phase['name']='shutdown'
        server.send_signal(signal.SIGTERM)
        try:server.wait(timeout=10)
        except subprocess.TimeoutExpired:server.kill();server.wait()
        stop.set();sampler.join(timeout=5);server_log.close()
        (base/f'server-memory-{trial}.json').write_text(json.dumps(samples,indent=2)+'\n')
    if code:raise RuntimeError(''.join(output))
    if server.returncode!=0:raise RuntimeError(f'server shutdown failed: {server.returncode}')
(base/'results.json').write_text(json.dumps(results,indent=2)+'\n')

