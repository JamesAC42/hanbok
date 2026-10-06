# Builds the zip to upload to the Chrome Web Store (Windows / PowerShell).
# Usage, from anywhere:  powershell -ExecutionPolicy Bypass -File extension\package.ps1
# Writes extension\dist\hanbok-study-<version>.zip. Same output as package.sh:
# the store build drops the localhost:3000 entries, which are only for
# developing against a local Hanbok server.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = $PSScriptRoot
$manifest = Get-Content -Raw -Encoding UTF8 (Join-Path $root 'manifest.json') | ConvertFrom-Json
$version = $manifest.version

# [string[]] keeps one-item lists as arrays, so they stay arrays in the JSON.
$dev = 'http://localhost*'
$manifest.host_permissions = [string[]]($manifest.host_permissions -notlike $dev)
foreach ($script in $manifest.content_scripts) {
    $script.matches = [string[]]($script.matches -notlike $dev)
    if ($script.PSObject.Properties['exclude_matches']) {
        $script.exclude_matches = [string[]]($script.exclude_matches -notlike $dev)
    }
}
$manifestJson = $manifest | ConvertTo-Json -Depth 20

# Top-level .js/.css/.html files plus the asset folders, like package.sh.
$files = @(Get-ChildItem -Path $root -File | Where-Object { $_.Extension -in '.js', '.css', '.html' })
foreach ($dir in 'icons', 'fonts', 'images') {
    $files += Get-ChildItem -Path (Join-Path $root $dir) -File -Recurse
}

$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$out = Join-Path $dist "hanbok-study-$version.zip"
if (Test-Path $out) { Remove-Item $out }

# Write entries by hand: Compress-Archive on Windows PowerShell 5.1 stores
# backslash paths, which the Chrome Web Store rejects.
$zip = [System.IO.Compression.ZipFile]::Open($out, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    $entry = $zip.CreateEntry('manifest.json')
    $writer = New-Object System.IO.StreamWriter($entry.Open(), (New-Object System.Text.UTF8Encoding($false)))
    $writer.Write($manifestJson)
    $writer.Dispose()

    foreach ($file in $files) {
        $name = $file.FullName.Substring($root.Length).TrimStart('\', '/').Replace('\', '/')
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $name) | Out-Null
    }
} finally {
    $zip.Dispose()
}

Write-Host "Wrote $out"
