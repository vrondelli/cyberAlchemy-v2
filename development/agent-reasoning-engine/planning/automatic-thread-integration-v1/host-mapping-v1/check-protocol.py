import sys,json,hashlib
from pathlib import Path
import jsonschema
package=Path(__file__).resolve().parent
schemas=Path(sys.argv[1])
fixtures=json.loads((package/'PROTOCOL-FIXTURES.json').read_text())
checks=[]
for row in fixtures:
    path=schemas/row['schema']
    schema=json.loads(path.read_text())
    jsonschema.validators.validator_for(schema).check_schema(schema)
    jsonschema.validate(row['value'],schema)
    checks.append({'schema':row['schema'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'status':'PASS'})
print(json.dumps({'status':'PASS','checks':checks,'claim':'Generated-schema compatibility only, not live RPC acceptance','model_calls':0},indent=2))
