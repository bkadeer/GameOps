@echo off
echo ========================================
echo Rebuilding GameOpsAgent with Lock Feature
echo ========================================
echo.

echo Stopping any running instances...
taskkill /F /IM GameOpsAgent.exe 2>nul

echo.
echo Cleaning build directories...
timeout /t 2 /nobreak >nul
rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul

echo.
echo Building executable...
venv\Scripts\python.exe -m PyInstaller --clean --onefile --noconsole --name GameOpsAgent --add-data "config.yaml;." --add-data ".env;." --add-data "assets;assets" --hidden-import yaml --hidden-import websockets --hidden-import psutil --hidden-import dotenv --hidden-import PIL --hidden-import PIL.Image --hidden-import win32api --hidden-import win32con --hidden-import win32gui --hidden-import win32process --hidden-import win32security --hidden-import win32service --hidden-import win32serviceutil --hidden-import pywintypes main.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build completed successfully!
    echo Executable: dist\GameOpsAgent.exe
    echo ========================================
    echo.
    echo New Features:
    echo - Professional lock screen with smooth animations
    echo - Venue logo display with glow effect
    echo - Dimmed background (60%% transparent)
    echo - Dynamic message updates via WebSocket
    echo - Complete input blocking (keyboard + mouse)
    echo - Auto-relaunch protection (tamper-proof)
    echo - Remote unlock from admin dashboard
    echo ========================================
    echo.
    echo IMPORTANT: Run as Administrator for full input blocking!
    echo Place your venue logo in: assets\logo.png
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Build failed! Check errors above.
    echo ========================================
)

echo.
pause
