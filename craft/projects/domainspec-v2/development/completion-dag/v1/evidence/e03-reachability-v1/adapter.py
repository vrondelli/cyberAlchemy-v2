"""IO shell for the bounded adapter. All commands use explicit paths and new outputs."""
import argparse
import ast
import hashlib
import json
import os
from pathlib import Path
import selectors
import signal
import stat
import subprocess
import tarfile
import time

import producer

HERE=Path(__file__).resolve().parent
E02=HERE.parent/'e02-reachability-v1'
REPO=HERE.parents[6]


def safe_read(root, logical, limit=16*1024*1024):
    """Open beneath a directory using O_NOFOLLOW at every component."""
    producer.name(logical)
    root=Path(root).absolute()
    fd=os.open('/',os.O_RDONLY|os.O_DIRECTORY)
    try:
        for segment in root.parts[1:]:
            child=os.open(segment,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=fd);os.close(fd);fd=child
        parts=logical.split('/')
        for segment in parts[:-1]:
            child=os.open(segment,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW,dir_fd=fd);os.close(fd);fd=child
        file_fd=os.open(parts[-1],os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK,dir_fd=fd)
        try:
            info=os.fstat(file_fd)
            producer.require(stat.S_ISREG(info.st_mode) and info.st_size<=limit,'UNSAFE_FILE')
            chunks=[];count=0
            while True:
                chunk=os.read(file_fd,min(65536,limit+1-count))
                if not chunk:break
                chunks.append(chunk);count+=len(chunk);producer.require(count<=limit,'BUFFER_LIMIT')
            after=os.fstat(file_fd)
            producer.require((info.st_size,info.st_mtime_ns,info.st_ino)==(after.st_size,after.st_mtime_ns,after.st_ino),'SOURCE_CHANGED')
            return b''.join(chunks)
        finally:os.close(file_fd)
    finally:os.close(fd)


def digest_file(path):
    h=hashlib.sha256()
    with Path(path).open('rb') as stream:
        for b in iter(lambda:stream.read(1024*1024),b''):h.update(b)
    return h.hexdigest()


def write_new(path,data):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    producer.require(path.parent.resolve()==path.parent.absolute(),'SYMLINK_OUTPUT')
    with path.open('xb') as stream:stream.write(data)


def record(path,value):write_new(path,producer.canonical(value))


def capture(argv,timeout=600,limit=16*1024*1024):
    """Bounded process output; always clean up the process group, including descendants."""
    proc=subprocess.Popen(argv,stdin=subprocess.DEVNULL,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
                          env={'PATH':'/usr/bin:/bin','LANG':'C','LC_ALL':'C','PYTHONDONTWRITEBYTECODE':'1'},
                          close_fds=True,start_new_session=True)
    sel=selectors.DefaultSelector();buffers={'stdout':bytearray(),'stderr':bytearray()};failure=None;start=time.monotonic()
    for n,s in [('stdout',proc.stdout),('stderr',proc.stderr)]:os.set_blocking(s.fileno(),False);sel.register(s,selectors.EVENT_READ,n)
    try:
        while sel.get_map():
            if time.monotonic()-start>timeout:failure='timeout';break
            for key,_ in sel.select(.05):
                chunk=os.read(key.fd,65536)
                if not chunk:sel.unregister(key.fileobj)
                else:buffers[key.data].extend(chunk)
                if sum(map(len,buffers.values()))>limit:failure='output-limit';break
            if failure:break
        if not failure:
            try:proc.wait(timeout=max(.01,timeout-(time.monotonic()-start)))
            except subprocess.TimeoutExpired:failure='timeout'
    finally:
        try:os.killpg(proc.pid,signal.SIGKILL)
        except ProcessLookupError:pass
        proc.wait();sel.close();proc.stdout.close();proc.stderr.close()
    return {'exit_code':proc.returncode,'failure':failure,'stdout':bytes(buffers['stdout']).decode('utf-8',errors='replace'),
            'stderr':bytes(buffers['stderr']).decode('utf-8',errors='replace')}


def verify_package(compiler):
    lock=producer.decode(safe_read(E02,'dependency-lock.json'));package=REPO/lock['compiler_package']['path']
    producer.require(digest_file(package)==lock['compiler_package']['sha256'],'COMPILER_PACKAGE_DRIFT')
    for item in lock['tools']:
        if item['id']=='node':producer.require(digest_file(item['path'])==item['sha256'],'NODE_DRIFT')
    with tarfile.open(package) as archive:
        for member in archive.getmembers():
            if member.isfile() and member.name.startswith('package/dist/'):
                producer.require(safe_read(compiler,member.name[8:])==archive.extractfile(member).read(),'COMPILER_DIST_DRIFT')
    return next(x['path'] for x in lock['tools'] if x['id']=='node')


def prepare(source,query,compiler,destination):
    destination=Path(destination).absolute();producer.require(not destination.exists() and not destination.is_symlink(),'OUTPUT_EXISTS')
    node=verify_package(compiler)
    result=capture([node,str(HERE/'compile_bridge.mjs'),str(Path(compiler).absolute()),str(Path(source).absolute())])
    producer.require(result['exit_code']==0 and not result['failure'],'COMPILATION_FAILED:'+result['stderr'])
    compiled=producer.decode(result['stdout'].encode());graph=compiled['graph'];certificate=compiled['certificate']
    q=safe_read(Path(query).absolute().parent,Path(query).name)
    source_bytes={}
    for item in graph['source_manifest']['sources']:
        data=safe_read(source,item['relative_path']);producer.require(producer.sha(data)==item['sha256'] and len(data)==item['size_bytes'],'SOURCE_DRIFT');source_bytes['source/'+item['relative_path']]=data
    definition=safe_read(E02.parent/'e01-reachability-v1','DEFINITION-PACK.json')
    prepared=producer.prepare(json.dumps(graph).encode(),q,producer.decode(definition)['excluded_claims'])
    destination.mkdir();trusted=destination/'trusted';workspace=destination/'workspace';trusted.mkdir();workspace.mkdir()
    for name,data in prepared.items():write_new(workspace/name,data)
    # Native compiler JSON is retained without applying integration numeric restrictions.
    inputs={'compiled_graph':json.dumps(graph,ensure_ascii=False,separators=(',',':')).encode(),
            'compiler_certificate':json.dumps(certificate,ensure_ascii=False,separators=(',',':')).encode(),
            'source_manifest':json.dumps(graph['source_manifest'],ensure_ascii=False,separators=(',',':')).encode(),
            'query':q,'definition':definition,'profile':safe_read(E02,'profile.json')}
    for role,data in inputs.items():write_new(trusted/(role+'.json'),data)
    for name,data in source_bytes.items():write_new(trusted/name,data)
    record(trusted/'compile-process.json',result)
    return {'state':'prepared-not-executed','root':str(destination),'authority_effect':'none'}


def verify_kit(kit):
    lock=producer.decode(safe_read(E02,'dependency-lock.json'));archive=REPO/lock['portable_archive']['path']
    producer.require(digest_file(archive)==lock['portable_archive']['sha256'],'KIT_ARCHIVE_DRIFT')
    with tarfile.open(archive) as t:
        for m in t.getmembers():
            if m.isfile():
                logical=m.name.split('/',1)[1]
                producer.require(safe_read(kit,logical)==t.extractfile(m).read(),'KIT_DRIFT:'+logical)
    return lock


def tree_snapshot(roots):
    """Explicit mount closure; used only by requested runtime freezing, never by evaluator."""
    entries=[]
    for root in roots:
        root=Path(root).absolute();producer.require(root.exists(),'RUNTIME_MISSING')
        selected=[root]
        while selected:
            path=selected.pop();info=path.lstat()
            if stat.S_ISLNK(info.st_mode):entries.append({'path':str(path),'kind':'symlink','target':os.readlink(path)})
            elif stat.S_ISDIR(info.st_mode):
                entries.append({'path':str(path),'kind':'directory'});selected.extend(sorted(path.iterdir(),reverse=True))
            else:
                producer.require(stat.S_ISREG(info.st_mode),'SPECIAL_RUNTIME_FILE')
                entries.append({'path':str(path),'kind':'file','sha256':digest_file(path),'size_bytes':info.st_size})
    return sorted(entries,key=lambda x:x['path'])


def freeze_runtime(kit,runtime,destination):
    verify_kit(kit)
    tree=ast.parse(safe_read(kit,'containment.py'))
    constants={}
    for n in tree.body:
        if isinstance(n,ast.Assign):
            for target in n.targets:
                if isinstance(target,ast.Name) and target.id in ('SYSTEM_DIRS','SYSTEM_FILES'):constants[target.id]=ast.literal_eval(n.value)
    systems=[p for p in constants['SYSTEM_DIRS']+constants['SYSTEM_FILES'] if Path(p).exists()]
    import re
    systems += [str(p) for p in sorted(Path('/usr/lib').glob('python3.*')) if p.is_dir() and re.fullmatch(r'python3\.\d+',p.name)]
    roots=sorted(set([str(Path(kit).absolute()),str(Path(runtime).absolute()),*systems]))
    record(Path(destination).absolute(),{'schema_version':'dsv2.runtime-tree-lock/v1-candidate','roots':roots,'runtime':str(Path(runtime).absolute()),
         'kit':str(Path(kit).absolute()),'system_paths':systems,'entries':tree_snapshot(roots),'authority_effect':'none'})


def execute(prepared,kit,runtime_lock):
    prepared=Path(prepared).absolute();kit=Path(kit).absolute();lock=verify_kit(kit)
    rt=producer.decode(safe_read(Path(runtime_lock).absolute().parent,Path(runtime_lock).name))
    producer.require(rt['kit']==str(kit) and tree_snapshot(rt['roots'])==rt['entries'],'RUNTIME_DRIFT')
    workspace=prepared/'workspace';trusted=prepared/'trusted'
    producer.require(not (trusted/'attempt.json').exists(),'RUN_ALREADY_ATTEMPTED')
    record(trusted/'attempt.json',{'state':'started','runtime_lock_sha256':digest_file(runtime_lock),'authority_effect':'none'})
    souffle=next(x for x in lock['tools'] if x['id']=='souffle')
    producer.require(Path(souffle['path']).is_relative_to(rt['runtime']),'RUNTIME_GRANT_MISMATCH')
    prefix=['/usr/bin/python3.12','-B',str(kit/'evf'),'--runtime',rt['runtime']]
    result=capture(prefix+['formal-tools','--workspace',str(workspace),'--souffle',souffle['path'],'--trust-local-tools'])
    record(trusted/'tool-process.json',result)
    if result['exit_code'] or result['failure']:
        record(trusted/'run-result.json',{'state':'not_evaluable','reason':'TOOL_BINDING_FAILED','authority_effect':'none'});return
    binding=producer.decode(result['stdout'].encode())
    producer.require(binding['containment']['read_only_system_paths']==rt['system_paths'],'RUNTIME_POLICY_DRIFT')
    result=capture(prefix+['formal-run','--workspace',str(workspace),'--spec','audit.json','--tools',binding['tools'],'--trust-local-providers'],timeout=900)
    record(trusted/'run-process.json',result)
    response=producer.decode(result['stdout'].encode()) if not result['failure'] else {'status':'not_evaluable','reason':result['failure']}
    producer.require(tree_snapshot(rt['roots'])==rt['entries'],'RUNTIME_DRIFT')
    record(trusted/'runtime-tree-lock.json',rt);record(trusted/'run-result.json',response)
    return response


def collect(prepared,consumer_manifest,review=None):
    """Reference-directed transfer only. No inferred success and no directory-wide evidence search."""
    prepared=Path(prepared).absolute();trusted=prepared/'trusted';workspace=prepared/'workspace'
    response=producer.decode(safe_read(trusted,'run-result.json'))
    def incomplete():
        graph=safe_read(trusted,'compiled_graph.json');query=safe_read(trusted,'query.json')
        diagnostic=capture(['/usr/bin/python3.12','-B',str(HERE/'consume.py'),'diagnose',
                            '--graph',str(trusted/'compiled_graph.json'),'--query',str(trusted/'query.json'),
                            '--graph-sha256',producer.sha(graph),'--query-sha256',producer.sha(query),
                            '--reason','NATIVE_EVIDENCE_INCOMPLETE'])
        record(trusted/'partial-consumer-process.json',diagnostic)
        return producer.decode(diagnostic['stdout'].encode())
    if 'formal_claims' not in response:return incomplete()
    claims=Path(response['formal_claims']);producer.require(claims.is_relative_to(workspace),'EVIDENCE_PATH_ESCAPE');bundle_name=claims.relative_to(workspace).as_posix()
    buffers={};host_refs={};visited=set()
    def visit(logical):
        producer.name(logical)
        if logical in visited:return
        producer.require(len(visited)<256,'COLLECTION_LIMIT');visited.add(logical)
        data=safe_read(workspace,logical);buffers[logical]=data
        producer.require(sum(map(len,buffers.values()))<=64*1024*1024,'COLLECTION_LIMIT')
        if logical.endswith('.json'):walk(producer.decode(data))
    def walk(value):
        if isinstance(value,dict):
            if {'path','sha256','size_bytes','location'}<=set(value):
                if value['location']=='repository':
                    visit(value['path']);producer.require(producer.sha(buffers[value['path']])==value['sha256'],'EVIDENCE_DRIFT')
                else:
                    producer.require(value['location']=='host','REFERENCE_LOCATION')
                    host_refs[value['path']]={k:value[k] for k in ('path','sha256','size_bytes')}
            else:
                for v in value.values():walk(v)
        elif isinstance(value,list):
            for v in value:walk(v)
    visit(bundle_name);bundle=producer.decode(buffers[bundle_name])
    producer.require(len(bundle['jobs'])==1,'DENOMINATOR_MISMATCH')
    if bundle['jobs'][0].get('status')!='passed':return incomplete()
    job=bundle['jobs'][0];roles={}
    for role in ['source_manifest','compiled_graph','compiler_certificate','query','definition','profile']:
        logical='inputs/'+role+'.json';buffers[logical]=safe_read(trusted,role+'.json');roles[role]=logical
    manifest=producer.decode(buffers[roles['source_manifest']])
    for x in manifest['sources']:buffers['source/'+x['relative_path']]=safe_read(trusted,'source/'+x['relative_path'])
    role_paths={'identity_map':'identity-map.json','positive_graph':'positive.json','negative_graph':'negative.json','audit_spec':'audit.json','positive_request':'positive-request.json','negative_request':'negative-request.json','obligation_text':'obligation.md',
                'formal_bundle':bundle_name,'formal_tools':bundle['tools_ref']['path'],'evf_profile':job['profile_ref']['path'],'evf_evidence':job['evidence_ref']['path']}
    for role,n in role_paths.items():roles[role]=n;visit(n)
    counters={'positive':0,'negative':0}
    for item in job['records']:
        record_value=producer.decode(buffers[item['path']]);case='positive' if record_value['request_ref']['path']=='positive-request.json' else 'negative'
        counters[case]+=1;roles[case+'_raw_'+str(counters[case])]=item['path']
    producer.require(counters=={'positive':2,'negative':2},'DENOMINATOR_MISMATCH')
    rt=producer.decode(safe_read(trusted,'runtime-tree-lock.json'));entries={x['path']:x for x in rt['entries'] if x['kind']=='file'}
    for path,ref in host_refs.items():
        producer.require(path in entries and all(entries[path][k]==ref[k] for k in ['sha256','size_bytes']),'UNLOCKED_HOST_REFERENCE')
        if path.endswith('/souffle'):ref['id']='souffle'
    dep={'schema_version':'dsv2.e03-execution-lock/v1-candidate','e02_dependency_sha256':producer.sha(safe_read(E02,'dependency-lock.json')),
         'runtime_tree_sha256':producer.sha(safe_read(trusted,'runtime-tree-lock.json')),'runtime_closure_status':'frozen','host_refs':list(host_refs.values()),'authority_effect':'none'}
    for role,data in [('dependency_lock',producer.canonical(dep)),('consumer_source_manifest',safe_read(Path(consumer_manifest).absolute().parent,Path(consumer_manifest).name)),
                      ('consumer_independence_review',safe_read(Path(review).absolute().parent,Path(review).name) if review else b'null'),('containment_context',producer.canonical(response['containment']))]:
        n='inputs/'+role+'.json';roles[role]=n;buffers[n]=data
    expected={'schema_version':'dsv2.owns-expected/v1-candidate',**{role:producer.file_ref(roles[role],buffers[roles[role]]) for role in ['source_manifest','compiled_graph','compiler_certificate','query','definition','profile','dependency_lock','consumer_source_manifest']}}
    handle=producer.handle(expected,buffers,roles)
    export=prepared/'transfer';export.mkdir()
    for n,b in buffers.items():write_new(export/n,b)
    record(trusted/'expected.json',expected);record(prepared/'handle.json',handle)
    return {'expected_sha256':producer.sha(producer.canonical(expected)),'handle_sha256':handle['sha256'],'transfer':str(export),'authority_effect':'none'}


def main():
    parser=argparse.ArgumentParser();sub=parser.add_subparsers(dest='command',required=True)
    p=sub.add_parser('prepare')
    for name in ['source','query','compiler','destination']:p.add_argument('--'+name,required=True)
    p=sub.add_parser('freeze-runtime')
    for name in ['kit','runtime','destination']:p.add_argument('--'+name,required=True)
    p=sub.add_parser('run')
    for name in ['prepared','kit','runtime-lock']:p.add_argument('--'+name,required=True)
    p=sub.add_parser('collect')
    for name in ['prepared','consumer-manifest']:p.add_argument('--'+name,required=True)
    p.add_argument('--review')
    args=vars(parser.parse_args());command=args.pop('command')
    try:
        result={'prepare':prepare,'freeze-runtime':freeze_runtime,'run':execute,'collect':collect}[command](**args)
        print(json.dumps(result or {'state':'recorded','authority_effect':'none'}))
    except (ValueError,OSError,KeyError,TypeError) as e:
        print(json.dumps({'state':'not_evaluable' if isinstance(e,FileNotFoundError) else 'BLOCK','reason':str(e),'authority_effect':'none'}));return 2
    return 0

if __name__=='__main__':raise SystemExit(main())
