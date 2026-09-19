import {DatabaseSync} from 'node:sqlite';
import {createCipheriv,createDecipheriv,createHmac,randomBytes} from 'node:crypto';
import {constants,openSync,closeSync,lstatSync} from 'node:fs';
import {dirname,isAbsolute} from 'node:path';
// Native custody only; Rust remains the permission decision owner. Open Questions: README.md.
export function createMemoryState(){return {mode:'ephemeral',sessions:new Map(),records:new Map(),transaction:fn=>fn(),close(){}};}

// Operator supplies an existing private directory and a separately retained 32-byte key.
// No key generation, database recovery/reset, or memory fallback occurs here.
export function openSqliteState({path,key}){
 if(!isAbsolute(path)||!Buffer.isBuffer(key)||key.length!==32)throw Error('STATE_BINDING');
 const secret=Buffer.from(key),parent=lstatSync(dirname(path));
 const privateFile=(s,directory=false)=>s.uid===process.getuid()&&(s.mode&0o077)===0&&(directory?s.isDirectory():s.isFile())&&!s.isSymbolicLink();
 if(!privateFile(parent,true))throw Error('STATE_DIRECTORY');
 const fd=openSync(path,constants.O_CREAT|constants.O_RDWR|constants.O_NOFOLLOW,0o600);closeSync(fd);
 if(!privateFile(lstatSync(path)))throw Error('STATE_FILE');
 let db,depth=0;
 const seal=(value,aad)=>{const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',secret,iv);c.setAAD(Buffer.from(aad));return Buffer.concat([iv,c.update(JSON.stringify(value)),c.final(),c.getAuthTag()]);};
 const unseal=(bytes,aad)=>{const b=Buffer.from(bytes),c=createDecipheriv('aes-256-gcm',secret,b.subarray(0,12));c.setAAD(Buffer.from(aad));c.setAuthTag(b.subarray(-16));return JSON.parse(Buffer.concat([c.update(b.subarray(12,-16)),c.final()]).toString());};
 function transaction(fn){if(depth)return fn();db.exec('BEGIN IMMEDIATE');depth++;try{const result=fn();if(result?.then)throw Error('STATE_ASYNC_TRANSACTION');db.exec('COMMIT');return result;}catch(error){db.exec('ROLLBACK');throw error;}finally{depth--;}}
 try{
  db=new DatabaseSync(path);db.exec('PRAGMA busy_timeout=3000; PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA secure_delete=ON');
  transaction(()=>{
   const version=db.prepare('PRAGMA user_version').get().user_version;
   if(version!==0&&version!==1)throw Error('STATE_SCHEMA');
   if(version===0){if(db.prepare("SELECT count(*) n FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").get().n)throw Error('STATE_SCHEMA');db.exec('CREATE TABLE meta (id INTEGER PRIMARY KEY CHECK(id=1), value BLOB NOT NULL); CREATE TABLE entries (space TEXT NOT NULL, id TEXT NOT NULL, value BLOB NOT NULL, PRIMARY KEY(space,id)); PRAGMA user_version=1');db.prepare('INSERT INTO meta VALUES(1,?)').run(seal('inference-state/v1','meta'));}
   const check=db.prepare('SELECT value FROM meta WHERE id=1').get();if(!check||unseal(check.value,'meta')!=='inference-state/v1')throw Error('STATE_KEY');
  });
 }catch{db?.close();secret.fill(0);throw Error('STATE_OPEN_FAILED');}
 const collection=space=>{
  const id=k=>createHmac('sha256',secret).update(space+'\0'+k).digest('hex');
  return {
   get(k){if(typeof k!=='string')return;const digest=id(k),row=db.prepare('SELECT value FROM entries WHERE space=? AND id=?').get(space,digest);return row?unseal(row.value,space+':'+digest).value:undefined;},
   set(k,value){const digest=id(k);db.prepare('INSERT INTO entries VALUES(?,?,?) ON CONFLICT(space,id) DO UPDATE SET value=excluded.value').run(space,digest,seal({key:k,value},space+':'+digest));},
   delete(k){if(typeof k==='string')db.prepare('DELETE FROM entries WHERE space=? AND id=?').run(space,id(k));},
   get size(){return db.prepare('SELECT count(*) n FROM entries WHERE space=?').get(space).n;},
   *[Symbol.iterator](){for(const row of db.prepare('SELECT id,value FROM entries WHERE space=?').all(space)){const entry=unseal(row.value,space+':'+row.id);yield [entry.key,entry.value];}},
   *keys(){for(const [k]of this)yield k;}
  };
 };
 return {mode:'sqlite-encrypted',sessions:collection('sessions'),records:collection('records'),transaction,close(){db.close();secret.fill(0);}};
}
