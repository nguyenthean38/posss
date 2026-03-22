# Script to add favicon to all HTML files
$htmlFiles = Get-ChildItem -Path . -Filter "*.html" | Where-Object { $_.Name -ne "login.html" }

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if favicon already exists
    if ($content -notmatch 'favicon\.svg') {
        # Find the title tag and add favicon after it
        $content = $content -replace '(<title>.*?</title>)', "`$1`n    <link rel=`"icon`" type=`"image/svg+xml`" href=`"assets/images/favicon.svg`" />"
        
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Added favicon to $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "Favicon already exists in $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! Favicon added to all HTML files." -ForegroundColor Cyan
