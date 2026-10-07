param(
    [Parameter(Mandatory = $true)][string]$OrbExe,
    [Parameter(Mandatory = $true)][string]$DashboardExe,
    [ValidateSet('verdant', 'cobalt', 'ember')][string]$Skin = 'verdant',
    [switch]$AbruptParentLoss,
    [switch]$CheckLiveSkin,
    [switch]$CheckPlacement
)

$ErrorActionPreference = 'Stop'
$orbPath = (Resolve-Path -LiteralPath $OrbExe).Path
$dashboardPath = (Resolve-Path -LiteralPath $DashboardExe).Path
$log = Join-Path $env:TEMP ('are-native-orb-launch-' + [guid]::NewGuid().ToString('N') + '.log')
$preferenceDirectory = Join-Path $env:TEMP ('are-native-orb-prefs-' + [guid]::NewGuid().ToString('N'))
[void][System.IO.Directory]::CreateDirectory($preferenceDirectory)
$preferencePath = Join-Path $preferenceDirectory 'companion.json'
[System.IO.File]::WriteAllText($preferencePath, ('{"skin":"' + $Skin + '","orbPlacement":"center"}'), [System.Text.UTF8Encoding]::new($false))
$priorPreferencePath = $env:ARE_COMPANION_PREFERENCES_PATH
$env:ARE_COMPANION_PREFERENCES_PATH = $preferencePath
$priorBrowserArguments = $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS
$debugPort = $null
if ($CheckLiveSkin -or $CheckPlacement) {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    $debugPort = $listener.LocalEndpoint.Port
    $listener.Stop()
    $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-address=127.0.0.1 --remote-debugging-port=$debugPort"
}

Add-Type @'
using System;
using System.Runtime.InteropServices;
[StructLayout(LayoutKind.Sequential)]
public struct AreOrbRect { public int Left, Top, Right, Bottom; }
public static class AreOrbInput {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr window, out AreOrbRect rect);
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr window, IntPtr after, int x, int y, int width, int height, uint flags);
    [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);
}
'@

function Activate-Orb([string]$executable, [string]$appearance, [string]$dashboardExecutable) {
    $trigger = Start-Process -FilePath $executable -ArgumentList @($appearance, '--dashboard', $dashboardExecutable) -PassThru
    if (-not $trigger.WaitForExit(10000) -or $trigger.ExitCode -ne 0) {
        throw 'The duplicate native-orb activation process failed.'
    }
}

$orb = $null
$dashboardPid = $null
try {
    $orb = Start-Process -FilePath $orbPath -ArgumentList @($Skin, '--dashboard', $dashboardPath) -RedirectStandardOutput $log -PassThru
    $handle = [IntPtr]::Zero
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 250
        $orb.Refresh()
        $handle = $orb.MainWindowHandle
        if ($handle -ne [IntPtr]::Zero) { break }
    }
    if ($handle -eq [IntPtr]::Zero) { throw 'Native orb window did not appear.' }
    for ($activation = 0; $activation -lt 5; $activation++) {
        Activate-Orb $orbPath $Skin $dashboardPath
        for ($attempt = 0; $attempt -lt 8; $attempt++) {
            Start-Sleep -Milliseconds 250
            $content = [string](Get-Content -LiteralPath $log -Raw -ErrorAction SilentlyContinue)
            $match = [regex]::Match($content, 'ARE_NATIVE_ORB_DASHBOARD_STARTED pid=(\d+)')
            if ($match.Success) { $dashboardPid = [int]$match.Groups[1].Value; break }
        }
        if ($dashboardPid) { break }
    }
    if (-not $dashboardPid) { throw "Dashboard did not start: $content" }
    $dashboard = Get-Process -Id $dashboardPid -ErrorAction Stop
    for ($attempt = 0; $attempt -lt 80; $attempt++) {
        Start-Sleep -Milliseconds 250
        $dashboard.Refresh()
        if ($dashboard.MainWindowHandle -ne [IntPtr]::Zero) { break }
    }
    if ($dashboard.MainWindowHandle -eq [IntPtr]::Zero) { throw 'Dashboard window did not open.' }
    $skinSynchronized = $false
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        $content = Get-Content -LiteralPath $log -Raw -ErrorAction SilentlyContinue
        if ($content -match ('ARE_NATIVE_ORB_SKIN_CHANGED ' + $Skin)) {
            $skinSynchronized = $true
            break
        }
        Start-Sleep -Milliseconds 100
    }
    if (-not $skinSynchronized) { throw "Initial dashboard skin did not reach the native orb: $content" }
    $liveSkinChanged = $false
    if ($CheckLiveSkin) {
        $nextSkin = if ($Skin -eq 'ember') { 'cobalt' } else { 'ember' }
        $probeOutput = Join-Path $env:TEMP ('are-native-orb-cdp-' + [guid]::NewGuid().ToString('N') + '.json')
        $probeError = Join-Path $env:TEMP ('are-native-orb-cdp-' + [guid]::NewGuid().ToString('N') + '.err')
        $probeScript = Join-Path $PSScriptRoot 'probe-windows-appearance.mjs'
        $nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
        $probe = Start-Process -FilePath $nodeExe -ArgumentList @($probeScript, "$debugPort", $nextSkin) -RedirectStandardOutput $probeOutput -RedirectStandardError $probeError -PassThru -Wait
        if ($probe.ExitCode -ne 0) {
            throw "Test-only dashboard skin selection failed: $([System.IO.File]::ReadAllText($probeError))"
        }
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            $content = Get-Content -LiteralPath $log -Raw -ErrorAction SilentlyContinue
            if ($content -match ('ARE_NATIVE_ORB_SKIN_CHANGED ' + $nextSkin)) {
                $liveSkinChanged = $true
                break
            }
            Start-Sleep -Milliseconds 100
        }
        if (-not $liveSkinChanged) { throw "Live dashboard skin did not reach the native orb: $content" }
        $saved = [System.IO.File]::ReadAllText($preferencePath) | ConvertFrom-Json
        if ($saved.skin -ne $nextSkin) { throw 'The selected skin was not saved.' }
    }
    $placementChanged = $false
    if ($CheckPlacement) {
        $initialRect = New-Object AreOrbRect
        if (-not [AreOrbInput]::GetWindowRect($handle, [ref]$initialRect)) { throw 'Initial native orb geometry is unavailable.' }
        $content = Get-Content -LiteralPath $log -Raw -ErrorAction SilentlyContinue
        $priorPositionCount = ([regex]::Matches($content, 'ARE_NATIVE_ORB_POSITION_REQUESTED x=(-?\d+) y=(-?\d+)')).Count
        $probeOutput = Join-Path $env:TEMP ('are-native-orb-placement-' + [guid]::NewGuid().ToString('N') + '.json')
        $probeError = Join-Path $env:TEMP ('are-native-orb-placement-' + [guid]::NewGuid().ToString('N') + '.err')
        $probeScript = Join-Path $PSScriptRoot 'probe-windows-appearance.mjs'
        $nodeExe = (Get-Command node.exe -ErrorAction Stop).Source
        $probe = Start-Process -FilePath $nodeExe -ArgumentList @($probeScript, "$debugPort", 'placement:top-right') -RedirectStandardOutput $probeOutput -RedirectStandardError $probeError -PassThru -Wait
        if ($probe.ExitCode -ne 0) {
            throw "Test-only dashboard placement selection failed: $([System.IO.File]::ReadAllText($probeError))"
        }
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            $content = Get-Content -LiteralPath $log -Raw -ErrorAction SilentlyContinue
            $positions = [regex]::Matches($content, 'ARE_NATIVE_ORB_POSITION_REQUESTED x=(-?\d+) y=(-?\d+)')
            if ($positions.Count -gt $priorPositionCount) {
                $last = $positions[$positions.Count - 1]
                $targetX = [int]$last.Groups[1].Value
                $targetY = [int]$last.Groups[2].Value
                $placedRect = New-Object AreOrbRect
                if ([AreOrbInput]::GetWindowRect($handle, [ref]$placedRect) -and
                    [Math]::Abs($placedRect.Left - $targetX) -le 4 -and
                    [Math]::Abs($placedRect.Top - $targetY) -le 4 -and
                    ($placedRect.Left -ne $initialRect.Left -or $placedRect.Top -ne $initialRect.Top)) {
                    $placementChanged = $true
                    break
                }
            }
            Start-Sleep -Milliseconds 100
        }
        if (-not $placementChanged) { throw "Native orb did not reach its selected position: $content" }
        $saved = [System.IO.File]::ReadAllText($preferencePath) | ConvertFrom-Json
        if ($saved.orbPlacement -ne 'top-right') { throw 'The selected orb placement was not saved.' }
    }
    if ($AbruptParentLoss) {
        Stop-Process -Id $orb.Id -Force -ErrorAction Stop
        if (-not $dashboard.WaitForExit(10000)) { throw 'Dashboard survived abrupt orb loss.' }
        [pscustomobject]@{
            schema_version = 'are.native-orb-dashboard-windows-test/v1'
            abrupt_orb_loss = $true
            owned_dashboard_exited = $true
            skin_synchronized = $skinSynchronized
            live_skin_changed = $liveSkinChanged
            placement_changed = $placementChanged
            skin = $Skin
            authority_effect = 'none'
        } | ConvertTo-Json -Compress
        return
    }
    for ($activation = 0; $activation -lt 5; $activation++) {
        Activate-Orb $orbPath $Skin $dashboardPath
        Start-Sleep -Milliseconds 400
        $content = Get-Content -LiteralPath $log -Raw
        if ($content -match 'ARE_NATIVE_ORB_DASHBOARD_ALREADY_RUNNING' -and
            $content -match 'ARE_NATIVE_ORB_DASHBOARD_FOCUS_SENT') { break }
    }
    if (([regex]::Matches($content, 'ARE_NATIVE_ORB_DASHBOARD_STARTED')).Count -ne 1 -or
        $content -notmatch 'ARE_NATIVE_ORB_DASHBOARD_ALREADY_RUNNING' -or
        $content -notmatch 'ARE_NATIVE_ORB_DASHBOARD_FOCUS_SENT') {
        throw "Second activation did not reuse the live dashboard: $content"
    }
    $foregroundIsDashboard = $false
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if ([AreOrbInput]::GetForegroundWindow() -eq $dashboard.MainWindowHandle) {
            $foregroundIsDashboard = $true
            break
        }
        Start-Sleep -Milliseconds 100
    }
    [void][AreOrbInput]::SendMessage($dashboard.MainWindowHandle, 0x10, [IntPtr]::Zero, [IntPtr]::Zero)
    if (-not $dashboard.WaitForExit(10000)) { throw 'Dashboard did not close normally.' }
    if ($CheckPlacement) {
        if (-not [AreOrbInput]::SetWindowPos($handle, [IntPtr]::Zero, $initialRect.Left, $initialRect.Top, 0, 0, 0x15)) {
            throw 'Could not move the disposable native orb away from its saved preset.'
        }
    }
    $content = Get-Content -LiteralPath $log -Raw
    $positionCountBeforeReopen = ([regex]::Matches($content, 'ARE_NATIVE_ORB_POSITION_REQUESTED x=(-?\d+) y=(-?\d+)')).Count
    $reopenedPid = $null
    for ($activation = 0; $activation -lt 5; $activation++) {
        Activate-Orb $orbPath $Skin $dashboardPath
        for ($attempt = 0; $attempt -lt 8; $attempt++) {
            Start-Sleep -Milliseconds 250
            $content = Get-Content -LiteralPath $log -Raw
            $starts = [regex]::Matches($content, 'ARE_NATIVE_ORB_DASHBOARD_STARTED pid=(\d+)')
            if ($starts.Count -eq 2) { $reopenedPid = [int]$starts[1].Groups[1].Value; break }
        }
        if ($reopenedPid) { break }
    }
    if (-not $reopenedPid -or $reopenedPid -eq $dashboardPid) {
        throw "Dashboard did not reopen as a new child: $content"
    }
    $dashboardPid = $reopenedPid
    $dashboard = Get-Process -Id $dashboardPid -ErrorAction Stop
    for ($attempt = 0; $attempt -lt 80; $attempt++) {
        Start-Sleep -Milliseconds 250
        $dashboard.Refresh()
        if ($dashboard.MainWindowHandle -ne [IntPtr]::Zero) { break }
    }
    if ($dashboard.MainWindowHandle -eq [IntPtr]::Zero) { throw 'Reopened dashboard window did not appear.' }
    $placementRestored = $false
    $placementReset = $false
    if ($CheckPlacement) {
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            $content = Get-Content -LiteralPath $log -Raw
            $positions = [regex]::Matches($content, 'ARE_NATIVE_ORB_POSITION_REQUESTED x=(-?\d+) y=(-?\d+)')
            $restoredRect = New-Object AreOrbRect
            if ($positions.Count -gt $positionCountBeforeReopen -and
                [AreOrbInput]::GetWindowRect($handle, [ref]$restoredRect) -and
                [Math]::Abs($restoredRect.Left - $targetX) -le 4 -and
                [Math]::Abs($restoredRect.Top - $targetY) -le 4) {
                $placementRestored = $true
                break
            }
            Start-Sleep -Milliseconds 100
        }
        if (-not $placementRestored) { throw 'Saved native orb placement was not restored after dashboard reopen.' }
        $positionCountBeforeReset = $positions.Count
        $probeOutput = Join-Path $env:TEMP ('are-native-orb-reset-' + [guid]::NewGuid().ToString('N') + '.json')
        $probeError = Join-Path $env:TEMP ('are-native-orb-reset-' + [guid]::NewGuid().ToString('N') + '.err')
        $probe = Start-Process -FilePath $nodeExe -ArgumentList @($probeScript, "$debugPort", 'placement:center') -RedirectStandardOutput $probeOutput -RedirectStandardError $probeError -PassThru -Wait
        if ($probe.ExitCode -ne 0) {
            throw "Test-only native orb reset selection failed: $([System.IO.File]::ReadAllText($probeError))"
        }
        for ($attempt = 0; $attempt -lt 40; $attempt++) {
            $content = Get-Content -LiteralPath $log -Raw
            $positions = [regex]::Matches($content, 'ARE_NATIVE_ORB_POSITION_REQUESTED x=(-?\d+) y=(-?\d+)')
            if ($positions.Count -gt $positionCountBeforeReset) {
                $last = $positions[$positions.Count - 1]
                $resetX = [int]$last.Groups[1].Value
                $resetY = [int]$last.Groups[2].Value
                $resetRect = New-Object AreOrbRect
                if ([AreOrbInput]::GetWindowRect($handle, [ref]$resetRect) -and
                    [Math]::Abs($resetRect.Left - $resetX) -le 4 -and
                    [Math]::Abs($resetRect.Top - $resetY) -le 4 -and
                    ($resetRect.Left -ne $targetX -or $resetRect.Top -ne $targetY)) {
                    $placementReset = $true
                    break
                }
            }
            Start-Sleep -Milliseconds 100
        }
        if (-not $placementReset) { throw 'Native orb did not reset to the selected center.' }
        $saved = [System.IO.File]::ReadAllText($preferencePath) | ConvertFrom-Json
        if ($saved.orbPlacement -ne 'center') { throw 'The center reset was not saved.' }
    }
    [void][AreOrbInput]::SendMessage($handle, 0x10, [IntPtr]::Zero, [IntPtr]::Zero)
    if (-not $orb.WaitForExit(10000)) { throw 'Orb did not close after WM_CLOSE.' }
    if (-not $dashboard.WaitForExit(10000)) { throw 'Owned dashboard survived normal orb close.' }
    [pscustomobject]@{
        schema_version = 'are.native-orb-dashboard-windows-test/v1'
        orb_exited = $true
        dashboard_opened = $true
        duplicate_dashboard_prevented = $true
        foreground_is_dashboard_after_second_click = $foregroundIsDashboard
        foreground_is_dashboard_after_second_activation = $foregroundIsDashboard
        dashboard_reopened_after_close = $true
        owned_dashboard_exited = $true
        skin_synchronized = $skinSynchronized
        live_skin_changed = $liveSkinChanged
        placement_changed = $placementChanged
        placement_restored_after_reopen = $placementRestored
        placement_reset_to_center = $placementReset
        skin = $Skin
        log = $log
        authority_effect = 'none'
    } | ConvertTo-Json -Compress
} finally {
    if ($dashboardPid) { Stop-Process -Id $dashboardPid -ErrorAction SilentlyContinue }
    if ($orb) { Stop-Process -Id $orb.Id -ErrorAction SilentlyContinue }
    $env:ARE_COMPANION_PREFERENCES_PATH = $priorPreferencePath
    $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = $priorBrowserArguments
}
