$count = 0
Get-ChildItem -Path "c:\Users\DL\Documents\Portfolio-Adsense" -Recurse -Include *.html, *.js, *.css, *.xml, *.txt -ErrorAction SilentlyContinue | Where-Object { $_.Name -ne "_redirects" } | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    
    $matchesOld = [regex]::Matches($content, 'muhammadgulfamali\.com')
    if ($matchesOld.Count -gt 0) {
        Write-Host "FOUND OLD DOMAIN IN $($_.Name): $($matchesOld.Count) instances"
        $count++
    }
    
    $matchesNonWww = [regex]::Matches($content, '(?<!www\.)automaze-studio\.com\.pk')
    if ($matchesNonWww.Count -gt 0) {
        # Check if it's just the email address (which doesn't have www.)
        $emailCount = [regex]::Matches($content, 'gulfam\.ali@automaze-studio\.com\.pk').Count
        if ($matchesNonWww.Count -gt $emailCount) {
            Write-Host "FOUND NON-WWW DOMAIN IN $($_.Name): $($matchesNonWww.Count - $emailCount) instances (excluding emails)"
            $count++
        }
    }
}

if ($count -eq 0) {
    Write-Host "ALL CHECKS PASSED. No stray domains found."
}
