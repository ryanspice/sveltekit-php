param(
  [string]$SiteId = "ryanspice.com",
  [string]$RuntimeRoot = "",
  [string]$ConfigPath = "",
  [switch]$Create,
  [switch]$AsJson
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-RuntimePath([string]$Value, [string]$BasePath) {
  if ([string]::IsNullOrWhiteSpace($Value)) { throw "Runtime path is empty." }
  $expanded = [Environment]::ExpandEnvironmentVariables($Value.Trim())
  if ([IO.Path]::IsPathRooted($expanded)) {
    return [IO.Path]::GetFullPath($expanded)
  }
  return [IO.Path]::GetFullPath((Join-Path $BasePath $expanded))
}

function New-SiteRuntimeLayout([string]$Root) {
  $paths = @(
    "data/drafts",
    "data/private",
    "data/encrypted",
    "data/db",
    "cache/svelte-kit",
    "cache/vite",
    "build",
    "releases",
    "receipts"
  )

  foreach ($path in $paths) {
    New-Item -ItemType Directory -Path (Join-Path $Root $path) -Force | Out-Null
  }
}

$RepoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
if ([string]::IsNullOrWhiteSpace($ConfigPath)) {
  $ConfigPath = Join-Path $RepoRoot "config/site-runtime.local.json"
}

$resolvedRoot = ""
$source = "default"
$resolvedConfigPath = ""

if (-not [string]::IsNullOrWhiteSpace($RuntimeRoot)) {
  $resolvedRoot = Resolve-RuntimePath -Value $RuntimeRoot -BasePath $RepoRoot
  $source = "parameter"
} elseif (Test-Path -LiteralPath $ConfigPath) {
  $resolvedConfigPath = (Resolve-Path -LiteralPath $ConfigPath).Path
  $config = Get-Content -LiteralPath $resolvedConfigPath -Raw | ConvertFrom-Json
  $siteConfig = $null
  if ($config.PSObject.Properties["sites"]) {
    $siteConfig = $config.sites.PSObject.Properties[$SiteId]
    if ($null -ne $siteConfig) { $siteConfig = $siteConfig.Value }
  }
  if ($null -ne $siteConfig -and $siteConfig.PSObject.Properties["runtimeRoot"]) {
    $resolvedRoot = Resolve-RuntimePath -Value ([string]$siteConfig.runtimeRoot) -BasePath $RepoRoot
    $source = "config"
  }
}

if ([string]::IsNullOrWhiteSpace($resolvedRoot) -and -not [string]::IsNullOrWhiteSpace($env:SVELTEKIT_PHP_SITE_RUNTIME_ROOT)) {
  $resolvedRoot = Resolve-RuntimePath -Value $env:SVELTEKIT_PHP_SITE_RUNTIME_ROOT -BasePath $RepoRoot
  $source = "environment"
}

if ([string]::IsNullOrWhiteSpace($resolvedRoot)) {
  $localAppData = [Environment]::GetFolderPath("LocalApplicationData")
  if ([string]::IsNullOrWhiteSpace($localAppData)) {
    throw "Unable to resolve LocalApplicationData for default runtime root."
  }
  $resolvedRoot = Join-Path $localAppData ("sveltekit-php/sites/{0}" -f $SiteId)
  $source = "default"
}

if ($Create) {
  New-SiteRuntimeLayout -Root $resolvedRoot
}

if ($AsJson) {
  [pscustomobject]@{
    siteId = $SiteId
    runtimeRoot = $resolvedRoot
    source = $source
    configPath = $resolvedConfigPath
  } | ConvertTo-Json -Depth 4
} else {
  Write-Output $resolvedRoot
}
