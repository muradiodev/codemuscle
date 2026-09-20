#Requires -Version 5.1
param(
  [ValidateSet("live")]
  [string]$Target = "live"
)

$ErrorActionPreference = "Stop"
$Secrets = Join-Path $PSScriptRoot "secrets"
$EnvFile = Join-Path $Secrets ".env"
$Config = Join-Path $Secrets "ssh.config"
$Archive = Join-Path $Secrets "codemuscle-src.tar.gz"
$RemoteScript = Join-Path $PSScriptRoot "remote.sh"

function Read-DotEnv([string]$Path) {
  $map = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#") -or $line -notmatch "=") { return }
    $name, $value = $line.Split("=", 2)
    $map[$name.Trim()] = $value.Trim()
  }
  return $map
}

function Protect-Key([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Missing SSH key: $Path"
  }
  $user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  icacls $Path /inheritance:r | Out-Null
  icacls $Path /grant:r "${user}:(R)" | Out-Null
}

function Write-SshConfig([hashtable]$EnvMap) {
  $unix = { param($p) ($p -replace "\\", "/") }
  $devKey = & $unix (Join-Path $Secrets "dev_key")
  $prodKey = & $unix (Join-Path $Secrets "prod_key")
  $mgmtKey = & $unix (Join-Path $Secrets "mgmt_key")
  $text = @"
Host hub-mgmt
  HostName $($EnvMap.SSH_MGMT_HOST)
  User $($EnvMap.SSH_MGMT_USER)
  IdentityFile $mgmtKey
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new

Host hub-dev
  HostName $($EnvMap.SSH_DEV_HOST)
  User $($EnvMap.SSH_DEV_USER)
  IdentityFile $devKey
  IdentitiesOnly yes
  ProxyJump hub-mgmt
  StrictHostKeyChecking accept-new

Host hub-prod
  HostName $($EnvMap.SSH_PROD_HOST)
  User $($EnvMap.SSH_PROD_USER)
  IdentityFile $prodKey
  IdentitiesOnly yes
  StrictHostKeyChecking accept-new
"@
  [IO.File]::WriteAllText($Config, ($text -replace "`r`n", "`n"))
}

if ($Target -ne "live") {
  throw "Only the live site on DEVHUBPOINT01 is wired. CodeMuscle is not deployed to PRODHUBPOINT01."
}

foreach ($name in @("dev_key", "prod_key", "mgmt_key")) {
  Protect-Key (Join-Path $Secrets $name)
}
if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Missing $EnvFile — copy deploy/env.example and fill it in."
}
if (-not (Test-Path -LiteralPath $RemoteScript)) {
  throw "Missing $RemoteScript"
}

$envMap = Read-DotEnv $EnvFile
foreach ($required in @(
    "SSH_DEV_HOST", "SSH_DEV_USER", "SSH_PROD_HOST", "SSH_PROD_USER",
    "SSH_MGMT_HOST", "SSH_MGMT_USER", "API_IMAGE", "WEB_IMAGE",
    "NEXT_PUBLIC_API_URL", "APP_DIR", "LIVE_API_HEALTH_URL", "LIVE_WEB_URL"
  )) {
  if (-not $envMap.ContainsKey($required) -or -not $envMap[$required]) {
    throw "deploy/secrets/.env is missing $required"
  }
}

Write-SshConfig $envMap
Write-Host "Packing source..."
python (Join-Path $PSScriptRoot "pack.py")
if ($LASTEXITCODE -ne 0) { throw "pack.py failed" }

$ssh = @("-F", $Config, "-o", "BatchMode=yes", "-o", "ConnectTimeout=25")
Write-Host "Uploading to $($envMap.SSH_DEV_HOST) via mgmt jump..."
scp @ssh $Archive "hub-dev:/tmp/codemuscle-src.tar.gz"
if ($LASTEXITCODE -ne 0) { throw "scp archive failed" }
scp @ssh $RemoteScript "hub-dev:/tmp/deploy_cm.sh"
if ($LASTEXITCODE -ne 0) { throw "scp remote script failed" }

$remote = @"
set -euo pipefail
sed -i 's/\r`$//' /tmp/deploy_cm.sh
chmod +x /tmp/deploy_cm.sh
export APP_DIR='$($envMap.APP_DIR)'
export API_IMAGE='$($envMap.API_IMAGE)'
export WEB_IMAGE='$($envMap.WEB_IMAGE)'
export NEXT_PUBLIC_API_URL='$($envMap.NEXT_PUBLIC_API_URL)'
bash /tmp/deploy_cm.sh
"@
$remoteUnix = $remote -replace "`r`n", "`n"
Write-Host "Building and switching CodeMuscle containers only..."
$remoteUnix | ssh @ssh hub-dev "bash -s"
if ($LASTEXITCODE -ne 0) { throw "remote deploy failed" }

Write-Host "Checking public URLs..."
$health = Invoke-WebRequest -UseBasicParsing $envMap.LIVE_API_HEALTH_URL
Write-Host $health.Content.Trim()
$code = (Invoke-WebRequest -UseBasicParsing $envMap.LIVE_WEB_URL -MaximumRedirection 5).StatusCode
Write-Host "web $($envMap.LIVE_WEB_URL) -> $code"
Write-Host "Live deploy finished."
