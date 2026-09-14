import {renameSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

export function persistLocalFailureLedger(driver, rows) {
  const path=resolve(driver,'local-failures.json'),temporary=resolve(driver,'.local-failures.json.tmp');
  const value={schema_version:'are.contextbench-local-failure-ledger/v1',rows:[...rows],recorded_failures:rows.length,authority_effect:'none'};
  writeFileSync(temporary,JSON.stringify(value,null,2)+'\n',{mode:0o600});
  renameSync(temporary,path);
  return value;
}
