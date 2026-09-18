"""Create the source-only Docker build context; never include provisioning output."""
from pathlib import Path
import shutil
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'integrations/scripts'))
from stage_runtime import stage
target=HERE/'.bundle'
if target.exists():sys.exit('Build context exists; remove this generated .bundle explicitly before rebuilding.')
target.mkdir()
try:
    stage(target/'runtime')
    shutil.copyfile(HERE/'Dockerfile',target/'Dockerfile')
    (target/'.dockerignore').write_text('**/node_modules\n**/__pycache__\n')
except BaseException:
    shutil.rmtree(target);raise
print('Source-only build context prepared.')
