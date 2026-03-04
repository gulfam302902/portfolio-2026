$root = 'c:\Users\DL\Documents\Portfolio-Adsense'
$files = Get-ChildItem -Path $root -Recurse -Include '*.html', '*.js', '*.css', '*.xml', '*.txt' -ErrorAction SilentlyContinue

$foundOld = @()
$foundNonWww = @()
$foundHttpWww = @()

foreach ($f in $files) {
    # Skip checking _redirects
    if ($f.Name -eq '_redirects') { continue }
    
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    
    if ($content -match 'muhammadgulfamali\.com') {
        $foundOld += $f.FullName
    }
    # Match automaze-studio.com.pk but NOT preceded by www.
    if ($content -match '(?<!www\.)automaze-studio\.com\.pk') {
        $foundNonWww += $f.FullName
    }
    if ($content -match 'http://www\.automaze-studio\.com\.pk') {
        $foundHttpWww += $f.FullName
    }
}

Write-Host "--- SCAN RESULTS ---"
Write-Host "Old Domain (muhammadgulfamali): $($foundOld.Count) files"
if ($foundOld.Count -gt 0) { $foundOld | ForEach-Object { Write-Host " - $_" } }

Write-Host "Non-WWW (automaze...): $($foundNonWww.Count) files"
if ($foundNonWww.Count -gt 0) { $foundNonWww | ForEach-Object { Write-Host " - $_" } }

Write-Host "HTTP (http://www...): $($foundHttpWww.Count) files"
if ($foundHttpWww.Count -gt 0) { $foundHttpWww | ForEach-Object { Write-Host " - $_" } }
