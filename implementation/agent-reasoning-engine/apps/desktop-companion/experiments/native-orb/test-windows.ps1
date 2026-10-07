param(
    [Parameter(Mandatory = $true)][string]$ExePath,
    [Parameter(Mandatory = $true)][string]$ScreenshotPath,
    [ValidateSet('verdant', 'cobalt', 'ember')][string]$Skin = 'verdant'
)

$ErrorActionPreference = 'Stop'
$exe = (Resolve-Path -LiteralPath $ExePath).Path
if (Test-Path -LiteralPath $ScreenshotPath) { throw 'Screenshot target already exists.' }
$log = Join-Path (Split-Path -Parent $exe) ('native-orb-' + [guid]::NewGuid().ToString('N') + '.log')

Add-Type @'
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential)]
public struct NativeOrbRect {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
}

public static class NativeOrbInput {
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr handle, out NativeOrbRect rect);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint dx, uint dy, uint data, UIntPtr extraInfo);
    [DllImport("user32.dll")] public static extern void keybd_event(byte virtualKey, byte scan, uint flags, UIntPtr extraInfo);
}
'@

function Read-WindowRect([IntPtr]$handle) {
    $rect = New-Object NativeOrbRect
    if (-not [NativeOrbInput]::GetWindowRect($handle, [ref]$rect)) { throw 'Could not read orb window bounds.' }
    return $rect
}

$process = Start-Process -FilePath $exe -ArgumentList $Skin -RedirectStandardOutput $log -PassThru
try {
    $handle = [IntPtr]::Zero
    for ($attempt = 0; $attempt -lt 40; $attempt++) {
        Start-Sleep -Milliseconds 250
        $process.Refresh()
        $handle = $process.MainWindowHandle
        if ($handle -ne [IntPtr]::Zero) { break }
    }
    if ($handle -eq [IntPtr]::Zero) { throw 'The native orb never opened a window.' }
    $before = Read-WindowRect $handle
    if (($before.Right - $before.Left) -ne 84 -or ($before.Bottom - $before.Top) -ne 84) {
        throw 'The native orb window is not 84 by 84 pixels.'
    }

    Add-Type -AssemblyName System.Drawing
    $bitmap = New-Object System.Drawing.Bitmap(84, 84)
    try {
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try { $graphics.CopyFromScreen($before.Left, $before.Top, 0, 0, $bitmap.Size) }
        finally { $graphics.Dispose() }
        $bitmap.Save($ScreenshotPath, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $bitmap.Dispose() }

    $cx = $before.Left + 42
    $cy = $before.Top + 42
    [void][NativeOrbInput]::SetForegroundWindow($handle)
    [void][NativeOrbInput]::SetCursorPos($cx, $cy)
    Start-Sleep -Milliseconds 100
    [NativeOrbInput]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
    [NativeOrbInput]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 100
    [NativeOrbInput]::keybd_event(0x0D, 0, 0, [UIntPtr]::Zero)
    [NativeOrbInput]::keybd_event(0x0D, 0, 2, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 300

    [void][NativeOrbInput]::SetCursorPos($cx, $cy)
    [NativeOrbInput]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 150
    [void][NativeOrbInput]::SetCursorPos(($cx + 24), ($cy + 16))
    Start-Sleep -Milliseconds 150
    [void][NativeOrbInput]::SetCursorPos(($cx + 96), ($cy + 64))
    Start-Sleep -Milliseconds 150
    [NativeOrbInput]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 400
    $after = Read-WindowRect $handle
    $sample = Get-Process -Id $process.Id
    $activations = ([regex]::Matches((Get-Content -LiteralPath $log -Raw), 'ARE_NATIVE_ORB_ACTIVATED')).Count
    $result = [pscustomobject]@{
        schema_version = 'are.native-orb-windows-spike/v1'
        skin = $Skin
        window_84x84 = $true
        private_bytes = $sample.PrivateMemorySize64
        working_set_bytes = $sample.WorkingSet64
        cpu_seconds = $sample.CPU
        activation_count = $activations
        pointer_and_enter_activated = ($activations -ge 2)
        before = @{ x = $before.Left; y = $before.Top }
        after = @{ x = $after.Left; y = $after.Top }
        drag_moved = (([math]::Abs($after.Left - $before.Left) + [math]::Abs($after.Top - $before.Top)) -ge 5)
        screenshot = $ScreenshotPath
        log = $log
    }
    $result | ConvertTo-Json -Compress
    if (-not $result.pointer_and_enter_activated -or -not $result.drag_moved) {
        throw 'The native orb failed pointer, Enter, or drag interaction.'
    }
} finally {
    Stop-Process -Id $process.Id -ErrorAction SilentlyContinue
}
