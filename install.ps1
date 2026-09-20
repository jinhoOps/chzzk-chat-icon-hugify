[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArgs
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Node.js가 있으면 scripts/launcher.js 실행, 없으면 install-online.ps1의 네이티브 런처 모드 사용
if (Get-Command node -ErrorAction SilentlyContinue) {
    & node "$ScriptDir\scripts\launcher.js" @ScriptArgs
    exit $LASTEXITCODE
} else {
    & "$ScriptDir\install-online.ps1" -InstallDir "$ScriptDir" @ScriptArgs
    exit $LASTEXITCODE
}
