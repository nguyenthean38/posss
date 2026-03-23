# Create default images for Staff and Customer
Add-Type -AssemblyName System.Drawing

function Create-DefaultImage {
    param(
        [string]$OutputPath,
        [string]$Text,
        [string]$BackgroundColorHex
    )
    
    $bitmap = New-Object System.Drawing.Bitmap(200, 200)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    $r = [Convert]::ToInt32($BackgroundColorHex.Substring(1, 2), 16)
    $g = [Convert]::ToInt32($BackgroundColorHex.Substring(3, 2), 16)
    $b = [Convert]::ToInt32($BackgroundColorHex.Substring(5, 2), 16)
    $bgColor = [System.Drawing.Color]::FromArgb($r, $g, $b)
    
    $graphics.Clear($bgColor)
    
    $font = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Bold)
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $rect = New-Object System.Drawing.RectangleF(0, 0, 200, 200)
    $graphics.DrawString($Text, $font, $brush, $rect, $format)
    
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    
    $graphics.Dispose()
    $bitmap.Dispose()
    $font.Dispose()
    $brush.Dispose()
    
    Write-Host "Created: $OutputPath"
}

$staffPath = Join-Path $PSScriptRoot "avatars\default-staff.png"
Create-DefaultImage -OutputPath $staffPath -Text "STAFF" -BackgroundColorHex "#3B82F6"

$customerPath = Join-Path $PSScriptRoot "customers\default-customer.png"
Create-DefaultImage -OutputPath $customerPath -Text "CUSTOMER" -BackgroundColorHex "#10B981"

Write-Host "Done! Created 2 default images."
