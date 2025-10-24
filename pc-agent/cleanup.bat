@echo off
echo ========================================
echo Cleaning up temporary and build files
echo ========================================
echo.

echo Removing build artifacts...
rmdir /s /q build 2>nul
rmdir /s /q dist 2>nul
del /q *.spec 2>nul

echo Removing Python cache...
for /d /r %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
del /s /q *.pyc 2>nul
del /s /q *.pyo 2>nul

echo Removing log files...
del /q *.log 2>nul
del /q agent.log.* 2>nul

echo Removing temporary files...
del /q *.tmp 2>nul
del /q *.temp 2>nul
del /q *~ 2>nul

echo.
echo ========================================
echo Cleanup complete!
echo ========================================
echo.
echo Kept:
echo - Source code (agent/)
echo - Configuration (config.yaml)
echo - Environment (.env)
echo - Documentation (*.md)
echo - Assets (assets/)
echo - Virtual environment (venv/)
echo ========================================
pause
