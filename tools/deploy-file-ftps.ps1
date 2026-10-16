[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$LocalPath,
  [Parameter(Mandatory)]
  [string]$RemotePath,
  [string]$FtpHost = 'monster.wlsrv.com',
  [string]$FtpUser = 'parkdedemankartal@developer.ortakgrow.com'
)

$ErrorActionPreference = 'Stop'

function ConvertTo-CurlConfigValue {
  param([Parameter(Mandatory)][string]$Value)

  $escaped = $Value.Replace('\', '\\').Replace('"', '\"')
  return '"' + $escaped + '"'
}

$resolvedLocalPath = (Resolve-Path -LiteralPath $LocalPath).Path
if (-not (Test-Path -LiteralPath $resolvedLocalPath -PathType Leaf)) {
  throw "Local file is missing: $resolvedLocalPath"
}

$securePassword = Read-Host 'FTP parolası' -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)

try {
  $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $credential = ConvertTo-CurlConfigValue "$FtpUser`:$password"
  $encodedPath = (@($RemotePath.Trim('/').Split('/') | ForEach-Object { [Uri]::EscapeDataString($_) }) -join '/')
  $remoteUrl = "ftp://$FtpHost/$encodedPath"
  $localUploadPath = $resolvedLocalPath.Replace('\', '/')
  $configLines = @(
    'url = ' + (ConvertTo-CurlConfigValue $remoteUrl)
    'user = ' + $credential
    'ftp-ssl-reqd'
    'ftp-create-dirs'
    'upload-file = ' + (ConvertTo-CurlConfigValue $localUploadPath)
    'fail'
    'silent'
    'show-error'
    'connect-timeout = 20'
  )

  Write-Host "Uploading $RemotePath"
  ($configLines -join [Environment]::NewLine) | & curl.exe --config -
  if ($LASTEXITCODE -ne 0) {
    throw "FTPS upload failed: $RemotePath"
  }
  Write-Host "Upload completed: $RemotePath"
}
finally {
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }
  Remove-Variable password -ErrorAction SilentlyContinue
}
