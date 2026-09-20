@echo off
chcp 65001 >nul
setlocal
set "SCRIPT_DIR=%~dp0"
node "%SCRIPT_DIR%scripts\launcher.js" %*
exit /b %ERRORLEVEL%
