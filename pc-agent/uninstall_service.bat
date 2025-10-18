@echo off
REM Uninstall GameOps PC Agent Windows Service
REM Run as Administrator

echo ========================================
echo GameOps PC Agent Service Uninstaller
echo ========================================
echo.

REM Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Stopping service...
net stop GameOpsAgent

echo.
echo Removing Windows Service...
python service_installer.py remove

echo.
echo ========================================
echo Uninstallation Complete!
echo ========================================
echo.
pause
