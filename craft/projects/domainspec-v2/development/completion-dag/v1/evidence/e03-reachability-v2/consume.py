"""Independent consumer IO boundary; no producer/adapter imports."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import sys
import consumer


def read_under(root,name):
    consumer.safe_name(name)
    components=Path(root).absolute().parts[1:]+tuple(name.split('/'))
    current=os.open('/',os.O_RDONLY|os.O_DIRECTORY)
    try:
        for i,part in enumerate(components):
            flags=os.O_RDONLY|os.O_NOFOLLOW|os.O_NONBLOCK
            if i<len(components)-1:flags|=os.O_DIRECTORY
            nxt=os.open(part,flags,dir_fd=current);os.close(current);current=nxt
        info=os.fstat(current);consumer.check(stat.S_ISREG(info.st_mode) and info.st_size<=16*1024*1024,'BUFFER_LIMIT')
        result=bytearray()
        while True:
            block=os.read(current,65536)
            if not block:break
            result.extend(block);consumer.check(len(result)<=16*1024*1024,'BUFFER_LIMIT')
        after=os.fstat(current);consumer.check((info.st_size,info.st_mtime_ns,info.st_ino)==(after.st_size,after.st_mtime_ns,after.st_ino),'INPUT_STALE')
        return bytes(result)
    finally:os.close(current)


def main():
    if len(sys.argv)>1 and sys.argv[1]=='diagnose':
        p=argparse.ArgumentParser();p.add_argument('command')
        for key in ['graph','query','graph-sha256','query-sha256','reason']:p.add_argument('--'+key,required=True)
        a=p.parse_args()
        try:
            g=Path(a.graph).absolute();q=Path(a.query).absolute()
            result=consumer.diagnose_unavailable(read_under(g.parent,g.name),read_under(q.parent,q.name),a.graph_sha256,a.query_sha256,a.reason)
        except FileNotFoundError:result={'aggregate':'not_evaluable','reason_code':'EVIDENCE_MISSING','authority_effect':'none'}
        print(json.dumps(result));return 2
    p=argparse.ArgumentParser();p.add_argument('--expected',required=True);p.add_argument('--expected-sha256',required=True)
    p.add_argument('--handle',required=True);p.add_argument('--transfer',required=True);p.add_argument('--review-sha256')
    args=p.parse_args()
    try:
        path=Path(args.expected).absolute();expected=consumer.parse(read_under(path.parent,path.name))
        consumer.check(consumer.hash_bytes(consumer.encode(expected))==args.expected_sha256,'INPUT_STALE')
        path=Path(args.handle).absolute()
        try: handle=consumer.parse(read_under(path.parent,path.name))
        except FileNotFoundError:handle=None
        buffers={}
        if handle is not None:
            consumer.check(len(handle['body']['files'])<=256,'BUFFER_LIMIT')
            for ref in handle['body']['files']:
                try:buffers[ref['logical_name']]=read_under(args.transfer,ref['logical_name'])
                except FileNotFoundError:continue
                consumer.check(sum(map(len,buffers.values()))<=64*1024*1024,'BUFFER_LIMIT')
            source_ref=expected['consumer_source_manifest'];manifest=consumer.parse(buffers[source_ref['logical_name']])
            consumer.check(consumer.hash_bytes(buffers[source_ref['logical_name']])==source_ref['sha256'],'INPUT_STALE')
            consumer.check(set(x['path'] for x in manifest['files'])=={'consumer.py','consume.py'},'INPUT_STALE')
            for source in manifest['files']:
                consumer.check(consumer.hash_bytes(read_under(Path(__file__).absolute().parent,source['path']))==source['sha256'],'INPUT_STALE')
        result=consumer.evaluate(expected,handle,buffers,args.review_sha256)
        print(json.dumps(result,indent=2));return 0 if result['aggregate']=='PASS' else 2
    except (ValueError,OSError,TypeError,KeyError,RecursionError) as e:
        state='not_evaluable' if isinstance(e,FileNotFoundError) else 'BLOCK'
        print(json.dumps({'aggregate':state,'reason':str(e),'authority_effect':'none'}));return 2

if __name__=='__main__':raise SystemExit(main())
