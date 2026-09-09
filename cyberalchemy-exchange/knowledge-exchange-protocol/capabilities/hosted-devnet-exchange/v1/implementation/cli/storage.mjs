import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {link,mkdir,open,readFile,rename,unlink} from 'node:fs/promises';
import {dirname,basename,resolve} from 'node:path';

const JOURNAL_FORMAT='kep-encrypted-journal-v1';
const JOURNAL_LIMIT=24_000_000;

function journalKey(value){const key=Buffer.from(value,'base64');if(key.length!==32)throw Error('Invalid recovery key for the send journal.');return key;}
function journalAad(scope){return Buffer.from(JSON.stringify([JOURNAL_FORMAT,scope]),'utf8');}

export async function readJson(path,maxBytes=1_500_000){
 const bytes=await readFile(path);if(bytes.length>maxBytes)throw Error(`Refusing oversized JSON file: ${path}`);return JSON.parse(bytes.toString('utf8'));
}

export async function writePrivateJson(path,value,{overwrite=false}={}){
 const target=resolve(path),parent=dirname(target);await mkdir(parent,{recursive:true,mode:0o700});
 const temporary=resolve(parent,`.${basename(target)}.${process.pid}.${crypto.randomUUID()}.tmp`);let handle;
 try{
  handle=await open(temporary,'wx',0o600);await handle.writeFile(JSON.stringify(value,null,2)+'\n');await handle.sync();await handle.close();handle=null;
  if(overwrite)await rename(temporary,target);else{await link(temporary,target);await unlink(temporary);}
 }catch(error){if(handle)await handle.close().catch(()=>{});await unlink(temporary).catch(()=>{});throw error;}
 return target;
}

export async function writeVerifiedFile(path,bytes,{overwrite=false}={}){
 const target=resolve(path),parent=dirname(target);await mkdir(parent,{recursive:true});
 const handle=await open(target,overwrite?'w':'wx',0o600);try{await handle.writeFile(bytes);await handle.sync();}finally{await handle.close();}return target;
}

export async function writeEncryptedJournal(path,value,{key,scope}){
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',journalKey(key),iv);cipher.setAAD(journalAad(scope));
 const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
 return writePrivateJson(path,{format:JOURNAL_FORMAT,ivBase64:iv.toString('base64'),ciphertextBase64:ciphertext.toString('base64'),tagBase64:cipher.getAuthTag().toString('base64')},{overwrite:true});
}

export async function readEncryptedJournal(path,{key,scope}){
 try{
  const value=await readJson(path,JOURNAL_LIMIT);if(value?.format!==JOURNAL_FORMAT)throw Error('format');
  const iv=Buffer.from(value.ivBase64||'','base64'),tag=Buffer.from(value.tagBase64||'','base64'),ciphertext=Buffer.from(value.ciphertextBase64||'','base64');
  if(iv.length!==12||tag.length!==16||!ciphertext.length)throw Error('shape');
  const decipher=createDecipheriv('aes-256-gcm',journalKey(key),iv);decipher.setAAD(journalAad(scope));decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(ciphertext),decipher.final()]).toString('utf8'));
 }catch(error){if(error.code==='ENOENT')throw error;throw Error('Unable to unlock the send journal. Check the account recovery file and command inputs.');}
}

export async function removePrivateFile(path){await unlink(resolve(path));}
