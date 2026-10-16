[CmdletBinding()]
param(
  [string]$DistPath = (Join-Path $PSScriptRoot '..\frontend\dist'),
  [string]$FtpHost = 'monster.wlsrv.com',
  [string]$FtpUser = 'parkdedemankartal@developer.ortakgrow.com',
  [string]$RemotePath = '',
  [switch]$BundleOnly,
  [string[]]$IncludePath
)

$ErrorActionPreference = 'Stop'

function ConvertTo-CurlConfigValue {
  param([Parameter(Mandatory)][string]$Value)

  $escaped = $Value.Replace('\', '\\').Replace('"', '\"')
  return '"' + $escaped + '"'
}

function Get-RelativeUploadPath {
  param(
    [Parameter(Mandatory)][string]$BasePath,
    [Parameter(Mandatory)][string]$FilePath
  )

  $baseFullPath = [IO.Path]::GetFullPath($BasePath).TrimEnd('\', '/') + [IO.Path]::DirectorySeparatorChar
  $fileFullPath = [IO.Path]::GetFullPath($FilePath)
  return (New-Object Uri($baseFullPath)).MakeRelativeUri((New-Object Uri($fileFullPath))).ToString()
}

$resolvedDist = (Resolve-Path -LiteralPath $DistPath).Path
$indexPath = Join-Path $resolvedDist 'index.html'

if (-not (Test-Path -LiteralPath $indexPath -PathType Leaf)) {
  throw "Build output is missing index.html: $indexPath"
}

if ($IncludePath -and $IncludePath.Count -gt 0) {
  $orderedFiles = @(
    $IncludePath |
      ForEach-Object { $_ -split ',' } |
      ForEach-Object { Get-Item -LiteralPath (Join-Path $resolvedDist $_.Trim()) }
  )
}
elseif ($BundleOnly) {
  $indexContent = Get-Content -Raw -LiteralPath $indexPath
  $assetMatches = [regex]::Matches($indexContent, '(?:src|href)="/parkdedemankartal/(assets/[^\"]+\.(?:js|css))"')
  $assetPaths = @(
    $assetMatches |
      ForEach-Object { Join-Path $resolvedDist $_.Groups[1].Value } |
      Sort-Object -Unique
  )
  $orderedFiles = @($assetPaths | ForEach-Object { Get-Item -LiteralPath $_ }) + @(Get-Item -LiteralPath $indexPath)
}
else {
  $allFiles = @(Get-ChildItem -LiteralPath $resolvedDist -File -Recurse)
  $orderedFiles = @(
    $allFiles |
      Where-Object { $_.FullName -ne $indexPath } |
      Sort-Object FullName
  ) + @(Get-Item -LiteralPath $indexPath)
}

$securePassword = Read-Host 'FTP parolası' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $credential = ConvertTo-CurlConfigValue "$FtpUser`:$password"
  $remoteBase = $RemotePath.Trim('/')
  $uploadedCount = 0

  foreach ($file in $orderedFiles) {
    $relativePath = (Get-RelativeUploadPath -BasePath $resolvedDist -FilePath $file.FullName).Replace('\', '/')
    $encodedSegments = @($relativePath.Split('/') | ForEach-Object { [Uri]::EscapeDataString($_) })
    $encodedPath = $encodedSegments -join '/'
    if ($remoteBase) {
      $encodedPath = "$remoteBase/$encodedPath"
    }

    $localPath = $file.FullName.Replace('\', '/')
    $remoteUrl = "ftp://$FtpHost/$encodedPath"
    $configLines = @(
      'url = ' + (ConvertTo-CurlConfigValue $remoteUrl)
      'user = ' + $credential
      'ftp-ssl-reqd'
      'ftp-create-dirs'
      'upload-file = ' + (ConvertTo-CurlConfigValue $localPath)
      'fail'
      'silent'
      'show-error'
      'connect-timeout = 20'
    )

    Write-Host "[$($uploadedCount + 1)/$($orderedFiles.Count)] $relativePath"
    $uploaded = $false
    foreach ($attempt in 1..3) {
      ($configLines -join [Environment]::NewLine) | & curl.exe --config -
      if ($LASTEXITCODE -eq 0) {
        $uploaded = $true
        break
      }
      if ($attempt -lt 3) {
        Start-Sleep -Seconds 2
      }
    }

    if (-not $uploaded) {
      throw "FTPS upload failed after 3 attempts: $relativePath"
    }

    $uploadedCount++
  }

  Write-Host "Upload completed: $uploadedCount files. index.html was transferred last."
}
finally {
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  Remove-Variable password -ErrorAction SilentlyContinue
}
