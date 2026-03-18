@echo off
echo ========================================
echo Updating HTML files to use new JS modules
echo ========================================
echo.

REM Backup old JS files
echo [1/3] Backing up old JS files...
if not exist "assets\js\old" mkdir "assets\js\old"
move /Y "assets\js\products.js" "assets\js\old\" 2>nul
move /Y "assets\js\categories.js" "assets\js\old\" 2>nul
move /Y "assets\js\customers.js" "assets\js\old\" 2>nul
move /Y "assets\js\reports.js" "assets\js\old\" 2>nul
move /Y "assets\js\profile.js" "assets\js\old\" 2>nul
move /Y "assets\js\dashboard.js" "assets\js\old\" 2>nul
echo Done!
echo.

REM Rename new files
echo [2/3] Renaming new JS files...
ren "assets\js\products-new.js" "products.js"
ren "assets\js\categories-new.js" "categories.js"
ren "assets\js\customers-new.js" "customers.js"
ren "assets\js\reports-new.js" "reports.js"
ren "assets\js\profile-new.js" "profile.js"
ren "assets\js\dashboard-new.js" "dashboard.js"
echo Done!
echo.

REM Update HTML files to use type="module"
echo [3/3] Updating HTML files...

REM products.html
powershell -Command "(Get-Content products.html) -replace '<script src=\"assets/js/products.js\"></script>', '<script type=\"module\" src=\"assets/js/products.js\"></script>' | Set-Content products.html"

REM categories.html
powershell -Command "(Get-Content categories.html) -replace '<script src=\"assets/js/categories.js\"></script>', '<script type=\"module\" src=\"assets/js/categories.js\"></script>' | Set-Content categories.html"

REM customers.html
powershell -Command "(Get-Content customers.html) -replace '<script src=\"assets/js/customers.js\"></script>', '<script type=\"module\" src=\"assets/js/customers.js\"></script>' | Set-Content customers.html"

REM reports.html
powershell -Command "(Get-Content reports.html) -replace '<script src=\"assets/js/reports.js\"></script>', '<script type=\"module\" src=\"assets/js/reports.js\"></script>' | Set-Content reports.html"

REM profile.html
powershell -Command "(Get-Content profile.html) -replace '<script src=\"assets/js/profile.js\"></script>', '<script type=\"module\" src=\"assets/js/profile.js\"></script>' | Set-Content profile.html"

REM dashboard.html
powershell -Command "(Get-Content dashboard.html) -replace '<script src=\"assets/js/dashboard.js\"></script>', '<script type=\"module\" src=\"assets/js/dashboard.js\"></script>' | Set-Content dashboard.html"

echo Done!
echo.

echo ========================================
echo Update Complete!
echo ========================================
echo.
echo Old JS files backed up to: assets\js\old\
echo All HTML files now use ES6 modules
echo.
echo You can now test the application!
echo.
pause
