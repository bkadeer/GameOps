@echo off
REM Install GameOps PC Agent as Windows Service
REM Run as Administrator

echo ========================================
echo GameOps PC Agent Service Installer
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

echo Installing Python dependencies...
pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Installing pywin32 service support...
python -m pip install pywin32
python Scripts\pywin32_postinstall.py -install

echo.
echo Creating Windows Service...
python service_installer.py install

echo.
echo Starting service...
net start GameOpsAgent

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Service Status:
sc query GameOpsAgent
echo.
echo To start/stop the service:
echo   net start GameOpsAgent
echo   net stop GameOpsAgent
echo.
echo To view logs:
echo   Check agent.log in the installation directory
echo.
pause
