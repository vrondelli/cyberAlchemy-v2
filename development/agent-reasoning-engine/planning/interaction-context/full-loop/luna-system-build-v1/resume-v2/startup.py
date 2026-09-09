import os,select,time

def read_startup(process,timeout=6):
 deadline=time.monotonic()+timeout
 out=b'';err=b''
 streams=[process.stdout,process.stderr]
 while time.monotonic()<deadline:
  ready,_,_=select.select(streams,[],[],max(0,deadline-time.monotonic()))
  if not ready:break
  for stream in ready:
   block=os.read(stream.fileno(),4096)
   if not block:
    streams.remove(stream)
    if stream is process.stdout:raise RuntimeError('server stdout closed before startup line; stderr='+repr(err[:1000]))
    continue
   if stream is process.stderr:err=(err+block)[-2000:];continue
   out+=block
   if b'\n' in out:return out.split(b'\n',1)[0].decode('utf8')
   if out.endswith(bytes([92,110])):raise RuntimeError('startup contains literal backslash-n, not a newline: '+repr(out[:1000]))
   if len(out)>16384:raise RuntimeError('startup line exceeds 16384 bytes')
 raise RuntimeError('server startup newline timeout; stdout='+repr(out[:1000])+'; stderr='+repr(err[:1000]))
