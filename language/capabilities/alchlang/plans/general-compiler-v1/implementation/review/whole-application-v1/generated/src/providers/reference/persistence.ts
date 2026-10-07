import type {Pool,PoolClient} from "pg";
import {REFERENCE_MIGRATION_SQL} from "./migration.js";
const CONNECTION_FAILURE="postgresql:connection-unavailable:commerce:submit-order";
const UNIQUE_FAILURE="postgresql:unique-violation:commerce:submit-order";
export interface ProviderBatch {readonly writes:readonly Readonly<{target:string;mode:string;value:unknown}>[];readonly events:readonly Readonly<{target:string;value:unknown}>[];}
export interface ProviderTransaction {read(request:Readonly<{target:string;key:unknown}>):Promise<unknown>;querySource(request:Readonly<{target:string}>):Promise<readonly unknown[]>;commit(batch:ProviderBatch):Promise<Readonly<{status:"committed"|"rejected"|"indeterminate"}>>;rollback():Promise<void>;}
function failure(error:unknown):Error{return new Error((error as {code?:unknown})?.code==="23505"?UNIQUE_FAILURE:CONNECTION_FAILURE);}
class Postgresql16Transaction implements ProviderTransaction {private settled=false;constructor(private readonly client:PoolClient){}
async read(_request:Readonly<{target:string;key:unknown}>):Promise<unknown>{throw new Error("PROVIDER_KEYED_READ_NOT_OBSERVED");}
async querySource(_request:Readonly<{target:string}>):Promise<readonly unknown[]>{throw new Error("PROVIDER_QUERY_NOT_OBSERVED");}
async commit(batch:ProviderBatch):Promise<Readonly<{status:"committed"|"rejected"|"indeterminate"}>>{if(this.settled)return Object.freeze({status:"indeterminate"});if(batch.writes.length||batch.events.length){try{await this.client.query("ROLLBACK");this.settled=true;this.client.release();return Object.freeze({status:"rejected"});}catch{this.settled=true;this.client.release();return Object.freeze({status:"indeterminate"});}}try{await this.client.query("COMMIT");this.settled=true;this.client.release();return Object.freeze({status:"committed"});}catch{this.settled=true;this.client.release();return Object.freeze({status:"indeterminate"});}}
async rollback():Promise<void>{if(this.settled)return;try{await this.client.query("ROLLBACK");}finally{this.settled=true;this.client.release();}}}
export class Postgresql16ApplicationStore {constructor(private readonly pool:Pool){}async begin():Promise<ProviderTransaction>{const client=await this.pool.connect();try{await client.query("BEGIN");return new Postgresql16Transaction(client);}catch(error){client.release();throw failure(error);}}async migrate():Promise<void>{try{await this.pool.query(REFERENCE_MIGRATION_SQL);}catch(error){throw failure(error);}}}
