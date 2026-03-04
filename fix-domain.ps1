$root = 'c:\Users\DL\Documents\Portfolio-Adsense'
$files = Get-ChildItem -Path $root -Recurse -Include '*.html','*.xml','*.txt' -ErrorAction SilentlyContinue
$count = 0

foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $original = $content

    # Replace old primary domain references (canonical, og:url, og:image, schema)
    $content = $content -replace 'https://muhammadgulfamali\.com', 'https://www.automaze-studio.com.pk'

    # Fix non-www automaze-studio references -> www
    $content = $content -replace 'https://automaze-studio\.com\.pk', 'https://www.automaze-studio.com.pk'

    # Fix old email across ALL remaining html files
    $content = $content -replace 'contact@muhammadgulfamali\.com', 'gulfam.ali@automaze-studio.com.pk'

    if ($content -ne $original) {
        [System.IO.File]::WriteAllText($f.FullName, $content, [System.Text.Encoding]::UTF8)
        $count++
        Write-Host "Updated: $($f.Name)"
    }
}

Write-Host ""
Write-Host "DONE. Total files updated: $count"
