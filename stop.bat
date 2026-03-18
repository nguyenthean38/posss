@echo off
REM PhoneStore POS - Docker Stop Script for Windows

echo.
echo ========================================
echo   Stopping PhoneStore POS
echo ========================================
echo.

docker-compose down

echo.
echo ========================================
echo   All services stopped!
echo ========================================
echo.
echo To start again: start.bat
echo To remove all data: docker-compose down -v
echo.
pause
