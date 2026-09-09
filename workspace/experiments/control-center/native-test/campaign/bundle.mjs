import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {isDeepStrictEqual as equal} from 'node:util';
import {verifyIndex,readEvidenceFile} from './evidence.mjs';
import {analyze,differential,digest,protocolBytes} from './analyze.mjs';
import {extractMetrics} from './collect.mjs';

export function verifyCampaign(directory,indexSha256) {
  const index=verifyIndex(directory,indexSha256);
  const read=path=>JSON.parse(readEvidenceFile(directory,path));
  const manifest=read('manifest.json'),input=read('attempts.json'),result=read('result.json');
  const require=(condition,reason)=>{if(!condition)throw new Error(reason);};
  require(manifest.schema==='cc-collector/v1'&&manifest.mode==='measurement','MEASUREMENT_CAMPAIGN_REQUIRED');
  require(equal(manifest.identity,input.identity)&&equal(result.identity,input.identity),'IDENTITY_MISMATCH');
  require(result.stopReason===null&&['PASS','FAIL'].includes(result.status),'CAMPAIGN_NOT_COMPLETE');
  require(equal(input.attempts,result.attempts),'ATTEMPT_COPY_DRIFT');
  require(digest(readEvidenceFile(directory,'protocol.json'))===digest(protocolBytes),'PROTOCOL_DRIFT');
  const analysis=analyze(input.identity,input.attempts,readEvidenceFile(directory,'budgets.json'));
  require(equal(analysis,result.analysis)&&analysis.status===result.status,'ANALYSIS_DRIFT');
  require(['PASS','FAIL'].includes(analysis.status),'POPULATION_INCOMPLETE');
  let apparatus=null;
  const expected=['manifest.json','budgets.json','protocol.json','attempts.json','result.json'];
  for(const a of input.attempts) {
    require(/^attempt-\d+-[A-Za-z0-9]+$/.test(a.runId),'ATTEMPT_PATH_INVALID');
    expected.push(`pre-${a.attempt}.json`);
    for(const file of ['attempt.json','launchflight.json','postflight.json','stdout.log','stderr.log'])expected.push(a.runId+'/'+file);
    require(equal(read(a.runId+'/attempt.json'),a),'RAW_ATTEMPT_DRIFT');
    require(a.status==='completed'&&Number.isInteger(a.result?.pid)&&a.result.exitCode===0&&!a.result.error&&!a.result.timedOut&&!a.result.interrupted&&!a.observationError&&!a.parseError,'PROCESS_FAILURE');
    require(equal(extractMetrics(readEvidenceFile(directory,a.runId+'/stdout.log').toString(),manifest.mode),a.metrics),'RAW_METRIC_DRIFT');
    for(const path of [`pre-${a.attempt}.json`,a.runId+'/launchflight.json',a.runId+'/postflight.json']) {
      const check=read(path);
      require(check.ok===true&&equal(check.current,input.identity)&&equal(check.errors,[])&&check.source?.selected_runtime_prerequisites_pass===true,'SOURCE_CHECK_FAILED');
      require(Array.isArray(check.apparatus)&&check.apparatus.length>0,'APPARATUS_MISSING');
      for(const file of check.apparatus)require(typeof file.path==='string'&&/^[a-f0-9]{64}$/.test(file.sha256),'APPARATUS_INVALID');
      apparatus??=check.apparatus;
      require(equal(apparatus,check.apparatus),'APPARATUS_DRIFT');
    }
  }
  require(equal(index.files.map(f=>f.path),expected.sort()),'ATTEMPT_COVERAGE');
  return {analysis,apparatus,indexSha256};
}

export function buildDifferential(beforeDirectory,beforeDigest,afterDirectory,afterDigest) {
  try {
    const before=verifyCampaign(beforeDirectory,beforeDigest),after=verifyCampaign(afterDirectory,afterDigest);
    if(!equal(before.apparatus,after.apparatus))throw new Error('COMPARISON_APPARATUS_MISMATCH');
    return {...differential(before.analysis,after.analysis),evidenceIndexes:{before:beforeDigest,after:afterDigest},
      claimCeiling:'Recomputed, hash-bound local evidence consistency only. Caller must retain trusted index digests. Not source/process attestation, product approval, or live-provider conformance.'};
  } catch(error) {return {status:'not_evaluable',errors:[error.message],deltas:[],authorityEffect:'none'};}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url) {
  const args=process.argv.slice(2);
  if(args.length!==4)throw new Error('Usage: bundle.mjs BEFORE_DIRECTORY BEFORE_INDEX_SHA256 AFTER_DIRECTORY AFTER_INDEX_SHA256');
  const result=buildDifferential(...args);console.log(JSON.stringify(result,null,2));process.exitCode=result.status==='COMPARABLE'?0:1;
}
