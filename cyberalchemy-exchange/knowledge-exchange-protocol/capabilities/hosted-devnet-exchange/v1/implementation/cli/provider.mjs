import {createPrivateKey,createPublicKey,sign} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {Keypair} from '@solana/web3.js';

const PKCS8_PREFIX=Buffer.from('302e020100300506032b657004220420','hex');

export async function loadKeypair(path){
 const value=JSON.parse(await readFile(path,'utf8'));
 if(!Array.isArray(value)||value.length!==64||value.some(byte=>!Number.isInteger(byte)||byte<0||byte>255))throw Error('Expected a Solana CLI keypair JSON file containing 64 bytes.');
 return Keypair.fromSecretKey(Uint8Array.from(value));
}

export function createLocalProvider(keypair,{approve=async()=>true}={}){
 const privateKey=createPrivateKey({key:Buffer.concat([PKCS8_PREFIX,Buffer.from(keypair.secretKey.slice(0,32))]),format:'der',type:'pkcs8'});
 const derived=createPublicKey(privateKey).export({format:'der',type:'spki'}).subarray(-32);
 if(!derived.equals(Buffer.from(keypair.publicKey.toBytes())))throw Error('Solana keypair public key does not match its private seed.');
 return {
  kind:'local-cli',publicKey:keypair.publicKey,supportsTransactions:true,
  async connect(){return {publicKey:keypair.publicKey};},
  async signMessage(message){if(!await approve({kind:'message',message}))throw Error('Signing cancelled.');return {signature:new Uint8Array(sign(null,Buffer.from(message),privateKey))};},
  async signTransaction(transaction){if(!await approve({kind:'transaction',transaction}))throw Error('Transaction signing cancelled.');transaction.partialSign(keypair);return transaction;}
 };
}
