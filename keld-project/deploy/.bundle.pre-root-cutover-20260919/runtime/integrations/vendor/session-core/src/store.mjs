import postgres from 'postgres';
import {randomBytes,createHash,createCipheriv,createDecipheriv} from 'node:crypto';
export const random=()=>randomBytes(32).toString('base64url');
export const digest=value=>createHash('sha256').update(value).digest('hex');
export class SessionError extends Error {constructor(code,status=401){super(code);this.code=code;this.status=status;}}
import {policy,isCurrent} from './policy.mjs';
export {policy,isCurrent} from './policy.mjs';
const schema=`
CREATE TABLE IF NOT EXISTS af_session_families(namespace text NOT NULL,id text NOT NULL,current_hash text NOT NULL,generation integer NOT NULL,status text NOT NULL CHECK(status IN ('active','revoked')),created double precision NOT NULL,last_activity double precision NOT NULL,absolute double precision NOT NULL,payload text NOT NULL,PRIMARY KEY(namespace,id));
CREATE TABLE IF NOT EXISTS af_session_handles(namespace text NOT NULL,hash text NOT NULL,family text NOT NULL,csrf_hash text NOT NULL,expires double precision NOT NULL,PRIMARY KEY(namespace,hash),FOREIGN KEY(namespace,family) REFERENCES af_session_families(namespace,id) ON DELETE CASCADE);
CREATE TABLE IF NOT EXISTS af_login_transactions(namespace text NOT NULL,hash text NOT NULL,parent text,generation integer,status text NOT NULL CHECK(status IN ('pending','claimed','complete','cancelled')),expires double precision NOT NULL,payload text NOT NULL,PRIMARY KEY(namespace,hash));
CREATE INDEX IF NOT EXISTS af_login_expiry ON af_login_transactions(namespace,expires);
CREATE INDEX IF NOT EXISTS af_family_expiry ON af_session_families(namespace,absolute);
`;
export function createStore({databaseUrl,namespace,key,clock}){
 if(!/^[a-z0-9-]{1,80}$/.test(namespace))throw Error('Invalid namespace');
 const encryptionKey=Buffer.from(key,'base64url');if(encryptionKey.length!==32)throw Error('A 32-byte encryption key is required');
 const sql=postgres(databaseUrl,{max:8,connect_timeout:3,idle_timeout:5,onnotice:()=>{},connection:{statement_timeout:5000,lock_timeout:3000,idle_in_transaction_session_timeout:10000}});
 const seal=(type,id,value)=>{const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',encryptionKey,iv);c.setAAD(Buffer.from(JSON.stringify([namespace,type,id])));const bytes=Buffer.concat([c.update(JSON.stringify(value)),c.final()]);return ['v1',iv.toString('base64url'),c.getAuthTag().toString('base64url'),bytes.toString('base64url')].join('.');};
 const open=(type,id,value)=>{const [version,iv,tag,data,...extra]=value.split('.');if(version!=='v1'||extra.length)throw Error('Invalid ciphertext');const c=createDecipheriv('aes-256-gcm',encryptionKey,Buffer.from(iv,'base64url'));c.setAAD(Buffer.from(JSON.stringify([namespace,type,id])));c.setAuthTag(Buffer.from(tag,'base64url'));return JSON.parse(Buffer.concat([c.update(Buffer.from(data,'base64url')),c.final()]).toString());};
 const time=async tx=>clock?clock():Number((await tx`select extract(epoch from clock_timestamp()) as now`)[0].now);
 const locked=work=>sql.begin(async tx=>{await tx`select pg_advisory_xact_lock(hashtextextended(${namespace},0))`;return work(tx)});
 async function find(tx,handle){if(typeof handle!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(handle))return undefined;return (await tx`select f.*,h.hash as presented_hash,h.csrf_hash,h.expires as handle_expires from af_session_handles h join af_session_families f on f.namespace=h.namespace and f.id=h.family where h.namespace=${namespace} and h.hash=${digest(handle)}`)[0];}
 function requireCurrent(row,now){if(!isCurrent(row,now)||row.current_hash!==row.presented_hash||Number(row.handle_expires)<=now)throw new SessionError('session_expired');}
 function unpack(row,now){return {...open('family',row.id,row.payload),family:row.id,generation:row.generation,created:Number(row.created),last:Number(row.last_activity),absolute:Number(row.absolute),now};}
 async function cleanup(tx,now){await tx`delete from af_login_transactions where namespace=${namespace} and expires<=${now}`;await tx`delete from af_session_families where namespace=${namespace} and absolute<=${now}`;}
 async function revokeRow(tx,row){if(!row)return;await tx`update af_session_families set status='revoked',payload=${seal('family',row.id,{})} where namespace=${namespace} and id=${row.id}`;await tx`update af_login_transactions set status='cancelled' where namespace=${namespace} and parent=${row.id} and status in ('pending','claimed')`;}
 return {
  namespace,
  async migrate(){await sql.begin(async tx=>{await tx`select pg_advisory_xact_lock(71194431)`;await tx.unsafe('CREATE TABLE IF NOT EXISTS af_session_schema(version integer PRIMARY KEY,digest text NOT NULL)');const existing=await tx`select digest from af_session_schema where version=1`;if(existing.length&&existing[0].digest!==digest(schema))throw Error('Session schema checksum mismatch');await tx.unsafe(schema);await tx`insert into af_session_schema(version,digest) values(1,${digest(schema)}) on conflict(version) do nothing`});},
  close:()=>sql.end({timeout:5}),
  async current(handle){const row=await find(sql,handle),now=await time(sql);requireCurrent(row,now);return unpack(row,now);},
  async begin({handle,previousLogin,data}){return locked(async tx=>{const now=await time(tx);await cleanup(tx,now);if(previousLogin)await tx`update af_login_transactions set status='cancelled' where namespace=${namespace} and hash=${digest(previousLogin)}`;
   const row=await find(tx,handle),parent=isCurrent(row,now)&&row.current_hash===row.presented_hash?row:undefined;
   const count=Number((await tx`select count(*) as n from af_login_transactions where namespace=${namespace} and status in ('pending','claimed')`)[0].n);if(count>=policy.capacity)throw new SessionError('auth_capacity',429);
   const id=random(),hash=digest(id),renew=Boolean(!data.fresh&&!data.action&&parent&&open('family',parent.id,parent.payload).tokenDeadline<=now),payload={...data,renew};
   await tx`insert into af_login_transactions(namespace,hash,parent,generation,status,expires,payload) values(${namespace},${hash},${parent?.id??null},${parent?.generation??null},'pending',${now+policy.transaction},${seal('transaction',hash,payload)})`;
   return {id,...payload,parent:parent?unpack(parent,now):undefined};
  });},
  async claim(login){if(typeof login!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(login))throw new SessionError('invalid_login');return locked(async tx=>{const now=await time(tx),hash=digest(login);const rows=await tx`update af_login_transactions set status='claimed' where namespace=${namespace} and hash=${hash} and status='pending' and expires>${now} returning *`;if(rows.length!==1)throw new SessionError('invalid_login');const row=rows[0];return {...open('transaction',hash,row.payload),hash,parent:row.parent,generation:row.generation};});},
  async complete({transaction,handle,identity,provision}){return locked(async tx=>{
   const now=await time(tx),t=(await tx`select * from af_login_transactions where namespace=${namespace} and hash=${transaction.hash}`)[0];
   if(!t||t.status!=='claimed'||Number(t.expires)<=now)throw new SessionError('cancelled_login');
   const original=open('transaction',t.hash,t.payload);let parent;
   if(t.parent){parent=await find(tx,handle);requireCurrent(parent,now);if(parent.id!==t.parent||parent.generation!==t.generation)throw new SessionError('cancelled_login');}
   const previous=parent?unpack(parent,now):undefined;
   if(previous&&previous.subject!==identity.subject||original.renew&&(!previous||previous.issuerSession!==identity.issuerSession))throw new SessionError('renewal_identity_changed');
   const count=Number((await tx`select count(*) as n from af_session_families where namespace=${namespace} and status='active' and absolute>${now} and last_activity>${now-policy.idle}`)[0].n);if(!parent&&count>=policy.capacity)throw new SessionError('auth_capacity',429);
   const absolute=original.renew?previous.absolute:now+policy.absolute;
   const local=await provision(Math.max(1,Math.floor(absolute-now)));
   const commitTime=await time(tx);if(Number(t.expires)<=commitTime||parent&&!isCurrent(parent,commitTime)||commitTime>=absolute)throw new SessionError('cancelled_login');
   // A family survives rotations, so logout using a previous handle still wins.
   const family=parent?.id??random(),id=random(),hash=digest(id),generation=(parent?.generation??0)+1;
   const payload={...identity,...local};
   const created=original.renew?previous.created:now,last=original.renew?previous.last:now;
   await tx`insert into af_session_families(namespace,id,current_hash,generation,status,created,last_activity,absolute,payload) values(${namespace},${family},${hash},${generation},'active',${created},${last},${absolute},${seal('family',family,payload)}) on conflict(namespace,id) do update set current_hash=excluded.current_hash,generation=excluded.generation,status=excluded.status,created=excluded.created,last_activity=excluded.last_activity,absolute=excluded.absolute,payload=excluded.payload`;
   await tx`insert into af_session_handles(namespace,hash,family,csrf_hash,expires) values(${namespace},${hash},${family},${digest(local.csrf)},${absolute})`;
   await tx`update af_login_transactions set status='cancelled' where namespace=${namespace} and parent=${family} and hash<>${t.hash} and status in ('pending','claimed')`;
   await tx`update af_login_transactions set status='complete' where namespace=${namespace} and hash=${t.hash}`;
   return {id,...payload,family,generation,absolute,last,created,now:commitTime};
  });},
  async checkLogout(handle,csrf){const row=await find(sql,handle),now=await time(sql);if(!row||Number(row.handle_expires)<=now)throw new SessionError('session_expired');if(typeof csrf!=='string'||digest(csrf)!==row.csrf_hash)throw new SessionError('csrf_required',403);return row.status==='active'?unpack(row,now):undefined;},
  async revoke(handle,login){return locked(async tx=>{const row=await find(tx,handle);if(login)await tx`update af_login_transactions set status='cancelled' where namespace=${namespace} and hash=${digest(login)}`;if(row&&Number(row.handle_expires)<=await time(tx))return undefined;const payload=row&&row.status==='active'?unpack(row,await time(tx)):undefined;await revokeRow(tx,row);return payload;});},
  async touch(handle){return locked(async tx=>{const row=await find(tx,handle),now=await time(tx);requireCurrent(row,now);await tx`update af_session_families set last_activity=${now} where namespace=${namespace} and id=${row.id}`;});},
  async withSession(handle,work){return locked(async tx=>{const row=await find(tx,handle),now=await time(tx);requireCurrent(row,now);return work(unpack(row,now));});},
 };
}
