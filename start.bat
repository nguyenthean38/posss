@echo off
REM PhoneStore POS - Docker Start Script for Windows

echo.
echo ========================================
echo   PhoneStore POS - Docker Setup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist .env (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env
    echo [SUCCESS] .env file created.
    echo.
)

REM Stop existing containers
echo [INFO] Stopping existing containers...
docker-compose down

REM Build and start containers
echo [INFO] Building and starting containers...
docker-compose up -d --build

REM Wait for services
echo [INFO] Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Show status
echo.
echo ========================================
echo   Service Status
echo ========================================
docker-compose ps

REM Show access information
echo.
echo ========================================
echo   PhoneStore POS is Ready!
echo ========================================
echo.
echo Frontend:    http://localhost:8080/frontend/login.html
echo Backend API: http://localhost:8080/backend/
echo phpMyAdmin:  http://localhost:8081
echo.
echo ========================================
echo   Default Login
echo ========================================
echo Username: admin
echo Password: admin123
echo.
echo ========================================
echo   Database Credentials
echo ========================================
echo Host:     localhost:3306
echo Database: phonestore_pos
echo User:     phonestore
echo Password: phonestore123
echo.
echo ========================================
echo   Useful Commands
echo ========================================
echo View logs:  docker-compose logs -f
echo Stop:       docker-compose down
echo Restart:    docker-compose restart
echo.
pause
