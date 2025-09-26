@echo off
echo DNSMasq Manager - Test Script
echo =============================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js is installed: %NODE_VERSION%

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm is installed: %NPM_VERSION%

REM Install dependencies
echo 📦 Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Build the application
echo 🔨 Building application...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo ✅ Application built successfully

REM Check if dnsmasq is available (optional)
dnsmasq --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ dnsmasq is available
) else (
    echo ⚠️  dnsmasq is not installed (required for full functionality)
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo To start the application:
echo   npm run start:dev    # Development mode
echo   npm run start:prod   # Production mode
echo.
echo To start with Docker:
echo   docker-compose up -d
echo.
echo Web interface will be available at: http://localhost:3000
echo.
pause
