export function extractMetrics(stdout,mode='smoke') {
  const reports=[];
  for(const line of stdout.split('\n')) {
    const start=line.indexOf('{"status":"CANDIDATE_PERFORMANCE_MEASURED"');
    if(start>=0) reports.push(JSON.parse(line.slice(start)));
  }
  if(reports.length!==1 || !Array.isArray(reports[0].performanceResults)) throw new Error('EXACTLY_ONE_PERFORMANCE_REPORT_REQUIRED');
  if(mode==='measurement'&&reports[0].collectionMode!=='measurement-only/v1')throw new Error('MEASUREMENT_MODE_NOT_PROVEN');
  const metrics={};
  for(const row of reports[0].performanceResults) {
    if(typeof row.name!=='string' || Object.hasOwn(metrics,row.name) || !Array.isArray(row.samplesMs) || !row.samplesMs.length || !row.samplesMs.every(n=>Number.isFinite(n)&&n>=0)) throw new Error('INVALID_PERFORMANCE_REPORT');
    metrics[row.name]=row.samplesMs;
  }
  return metrics;
}
