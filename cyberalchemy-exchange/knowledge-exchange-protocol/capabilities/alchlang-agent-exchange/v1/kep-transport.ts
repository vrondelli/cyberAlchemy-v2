import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {createPublicKey,verify} from 'node:crypto';
import {canonical,sha,type Receipt} from './exchange.ts';

export class KepBridge {
  private child:ChildProcessWithoutNullStreams;
  private pending:{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}|null=null;
  private buffer='';private closed=false;
  constructor(binary=process.env.KEP_BRIDGE_BINARY){
    if(!binary)throw new Error('KEP_BRIDGE_BINARY required; use validate.py');
    this.child=spawn(binary,[],{stdio:['pipe','pipe','pipe']});
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data',(chunk:string)=>{
      this.buffer+=chunk;
      if(Buffer.byteLength(this.buffer)>600000){this.fail(new Error('bridge output bounds'));this.child.kill();return;}
      const index=this.buffer.indexOf('\n');if(index<0)return;
      const line=this.buffer.slice(0,index);this.buffer=this.buffer.slice(index+1);
      const pending=this.pending;this.pending=null;
      if(!pending){this.child.kill();return;}
      clearTimeout(pending.timer);
      try{const value=JSON.parse(line);if(value.status==='rejected')pending.reject(new Error(value.error));else pending.resolve(value);}
      catch{pending.reject(new Error('invalid bridge response'));}
    });
    this.child.stderr.resume();
    this.child.stdin.on('error',(e)=>this.fail(e));
    this.child.on('error',(e)=>{this.closed=true;this.fail(e);});
    this.child.on('exit',()=>{this.closed=true;this.fail(new Error('bridge exited'));});
  }
  private fail(e:Error){if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(e);this.pending=null;}}
  request(value:unknown):Promise<any>{
    if(this.closed || this.pending)return Promise.reject(new Error('bridge closed or busy'));
    const bytes=JSON.stringify(value)+'\n';if(Buffer.byteLength(bytes)>600000)return Promise.reject(new Error('bridge input bounds'));
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.fail(new Error('bridge timeout'));this.child.kill();},10000);
      this.pending={resolve,reject,timer};this.child.stdin.write(bytes);
    });
  }
  async close(){
    if(this.closed)return;
    this.fail(new Error('bridge closed'));
    await new Promise<void>(resolve=>{
      const timer=setTimeout(()=>this.child.kill('SIGKILL'),1000);
      this.child.once('exit',()=>{clearTimeout(timer);resolve();});this.child.stdin.end();
      if(this.closed){clearTimeout(timer);resolve();}
    });
  }
}
export function verifySignedReceipt(receipt:Receipt, ack:any, recipientPublicKeyDer:string):boolean{
  try {
    const bytes=canonical(receipt);
    return ack.status==='acknowledged' && ack.receipt_sha256===sha(bytes)
      && verify('sha256',Buffer.from(bytes),createPublicKey({key:Buffer.from(recipientPublicKeyDer,'hex'),format:'der',type:'spki'}),Buffer.from(ack.signature_der,'hex'));
  }catch{return false;}
}
