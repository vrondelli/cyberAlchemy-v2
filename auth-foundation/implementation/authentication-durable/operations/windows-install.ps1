param([string]$Repository='\\wsl.localhost\Ubuntu\home\vrondelli\projects\domainspec-core\projects\auth-foundation\implementation\authentication-durable')
$ErrorActionPreference='Stop'
$certPath=Join-Path $Repository '.runtime\operations\pki\ca.crt'
$cert=New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
$store=New-Object System.Security.Cryptography.X509Certificates.X509Store('Root','CurrentUser')
$store.Open('ReadWrite')
try { $store.Add($cert) } finally { $store.Close() }
$startup=[Environment]::GetFolderPath('Startup')
$node= (Get-Content (Join-Path $Repository '.runtime\operations\windows-start.json') -Raw | ConvertFrom-Json)
$command='wsl.exe -d Ubuntu --exec "'+$node.node+'" "'+$node.script+'"'
$vbs='CreateObject("WScript.Shell").Run "'+$command.Replace('"','""')+'", 0, False'
Set-Content -Path (Join-Path $startup 'Auth Foundation.vbs') -Value $vbs -Encoding ASCII
@{ status='passed'; trust='CurrentUser Root'; thumbprint=$cert.Thumbprint; startup='Current-user Windows logon' } | ConvertTo-Json -Compress
