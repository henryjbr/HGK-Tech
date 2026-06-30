$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$sdk = if ($env:HGK_WEBVIEW2_SDK) {
  $env:HGK_WEBVIEW2_SDK
} else {
  "D:\Temp\hgk-webview2-sdk\package"
}
$build = "D:\Temp\hgk-dashboard-light-build"
$stage = Join-Path $build "stage"
$app = Join-Path $stage "app"
$installer = Join-Path $build "HGK-Dashboard-Windows-Setup.exe"

if (-not $build.EndsWith("hgk-dashboard-light-build", [StringComparison]::OrdinalIgnoreCase)) {
  throw "Diretorio temporario inseguro: $build"
}

if (Test-Path -LiteralPath $build) {
  Remove-Item -LiteralPath $build -Recurse -Force
}
New-Item -ItemType Directory -Path $app -Force | Out-Null

$core = Join-Path $sdk "lib\net462\Microsoft.Web.WebView2.Core.dll"
$winForms = Join-Path $sdk "lib\net462\Microsoft.Web.WebView2.WinForms.dll"
$loader = Join-Path $sdk "runtimes\win-x64\native\WebView2Loader.dll"
foreach ($required in @($core, $winForms, $loader)) {
  if (-not (Test-Path -LiteralPath $required)) {
    throw "Arquivo WebView2 ausente: $required"
  }
}

Copy-Item -LiteralPath $core, $winForms, $loader -Destination $stage
Copy-Item -LiteralPath (Join-Path $root "dashboard.html") -Destination $app
Copy-Item -LiteralPath (Join-Path $root "dashboard.html") -Destination (Join-Path $app "index.html")
Copy-Item -LiteralPath (Join-Path $root "dashboard.css") -Destination $app
Copy-Item -LiteralPath (Join-Path $root "dashboard.js") -Destination $app
Copy-Item -LiteralPath (Join-Path $root "supabase-config.js") -Destination $app
Copy-Item -LiteralPath (Join-Path $root "assets") -Destination $app -Recurse

$csc = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$source = Join-Path $root "desktop-light\HgkDashboard.cs"
$exe = Join-Path $stage "HGK Dashboard.exe"
& $csc /nologo /target:winexe /platform:x64 /optimize+ `
  "/out:$exe" `
  "/win32icon:$(Join-Path $root 'desktop\icon.ico')" `
  /reference:System.dll `
  /reference:System.Core.dll `
  /reference:System.Drawing.dll `
  /reference:System.Windows.Forms.dll `
  "/reference:$core" `
  "/reference:$winForms" `
  $source
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao compilar o aplicativo WebView2."
}

$makensis = Get-ChildItem "$env:LOCALAPPDATA\electron-builder\Cache\nsis-*\nsis-*\Bin\makensis.exe" -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
if (-not $makensis) {
  throw "Compilador NSIS nao encontrado."
}

& $makensis.FullName `
  "/DSTAGE_DIR=$stage" `
  "/DOUTPUT_FILE=$installer" `
  (Join-Path $root "desktop-light\installer.nsi")
if ($LASTEXITCODE -ne 0) {
  throw "Falha ao gerar o instalador leve."
}

Copy-Item -LiteralPath $installer -Destination (Join-Path $root "HGK-Dashboard-Windows-Leve-Setup.exe") -Force
Write-Output "Instalador WebView2 criado."
