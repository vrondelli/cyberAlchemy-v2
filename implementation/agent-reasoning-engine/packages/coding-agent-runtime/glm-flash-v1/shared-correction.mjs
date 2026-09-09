// Open questions: ../../../benchmarks/glm-episodes-v1/FORMAT-REPAIR.md
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {PATCH_SCHEMA} from '../patch-schema.mjs';
import {runNativeFormatRepair,formatRepairEligibility,protectedPatchProjection} from './format-repair.mjs';
import {runPublicRepairFeedback} from './public-feedback.mjs';
export const SHARED_CORRECTION_POLICY='shared-correction-v2';
export async function runSharedCorrection({candidate,rejected_text,...options}) {
 const {directory,request_once}=options;
 if(![0,1].includes(options.maximum_model_retries??0))throw Error('correction-retry-budget-invalid');
 if((candidate!==undefined)===(rejected_text!==undefined))throw Error('correction-input-ambiguous');
 mkdirSync(directory,{mode:0o700});
 const save=(name,x)=>writeFileSync(join(directory,name),JSON.stringify(x,null,2)+'\n',{flag:'wx',mode:0o600});
 save('manifest.json',{policy:SHARED_CORRECTION_POLICY,maximum_correction_requests:1,maximum_model_attempts:1+(options.maximum_model_retries??0),...((options.maximum_model_retries??0)?{maximum_model_retries:options.maximum_model_retries}:{automatic_retries:0}),authority_effect:'none',open_questions_ref:'../README.md#open-questions'});
 let dispatches=0,format=null;
 const once=async prompt=>{if(dispatches>=1)throw Error('correction-budget-exhausted');dispatches++;return request_once(prompt);};
 const finish=result=>{const value={...result,format,correction_dispatches:dispatches,authority_effect:'none'};save('result.json',value);return value;};
 let eligibility=null;
 if(rejected_text!==undefined) {
  eligibility=formatRepairEligibility(rejected_text,options.base);
  if(!eligibility.eligible){
   format=await runNativeFormatRepair({text:rejected_text,base:options.base,directory:join(directory,'format'),check_readiness:options.check_readiness,request_once:once});
   return finish({...format,reason_codes:[format.reason]});
  }
  // Only an isolated validation envelope. It can never take the UNCHANGED path.
  candidate={...protectedPatchProjection(eligibility.raw,options.base),schema_version:PATCH_SCHEMA.properties.schema_version.enum[0],authority_effect:PATCH_SCHEMA.properties.authority_effect.enum[0]};
 }
 const semantic=await runPublicRepairFeedback({...options,candidate,...(eligibility?{rejected_text}:{}),directory:join(directory,'public'),request_once:once,maximum_model_attempts:1});
 if(eligibility)format={status:semantic.candidate&&dispatches===1?'FORMAT_REPAIRED':'BLOCK',original_sha256:eligibility.original_sha256,diagnostics:eligibility.diagnostics,model_attempts:semantic.model_attempts,semantic_validation_required:false,authority_effect:'none'};
 return finish({...semantic,model_attempts:semantic.model_attempts,correction_kind:dispatches?(eligibility?(semantic.before?.ok?'format':'schema-and-semantic'):'semantic'):null});
}
