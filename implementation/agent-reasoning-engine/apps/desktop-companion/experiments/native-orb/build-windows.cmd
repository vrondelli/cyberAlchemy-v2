@echo off
setlocal
rem Isolated feasibility build only; this does not change the Companion installer.
call "%ProgramFiles(x86)%\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat" -arch=x64 -host_arch=x64 >nul
if errorlevel 1 exit /b %errorlevel%
set "RUSTUP_TOOLCHAIN=1.98.1-x86_64-pc-windows-msvc"
set "CARGO_BUILD_JOBS=2"
set "TEMP=%~dp0"
set "TMP=%~dp0"
set "TMPDIR=%~dp0"
"%USERPROFILE%\.rustup\toolchains\1.98.1-x86_64-pc-windows-msvc\bin\cargo.exe" build --release --locked --manifest-path "%~dp0Cargo.toml"
exit /b %errorlevel%
