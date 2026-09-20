[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$ScriptArgs
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& node "$ScriptDir\scripts\launcher.js" @ScriptArgs
exit $LASTEXITCODE
