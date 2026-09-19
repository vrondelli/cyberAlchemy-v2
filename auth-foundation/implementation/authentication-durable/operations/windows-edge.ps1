$ErrorActionPreference='Stop'
$profile=Join-Path $env:LOCALAPPDATA 'AuthFoundationEdgeTest'
try { $null=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:19222/json/version' -TimeoutSec 2 } catch {
 Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList @('--headless=new','--remote-debugging-port=19222','--remote-debugging-address=127.0.0.1','--no-first-run',"--user-data-dir=$profile",'about:blank')
}
for($i=0;$i -lt 30;$i++) { try { $null=Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:19222/json/version' -TimeoutSec 2; exit 0 } catch { Start-Sleep -Milliseconds 500 } }
throw 'Native Edge CDP readiness timed out'
