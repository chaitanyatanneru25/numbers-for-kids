@echo off
title Maths for Kid - Launcher
color 0A

echo ===================================================
echo     🚀 Welcome to Maths for Kid! 🚀
echo ===================================================
echo.
echo Checking Python environment...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not found in your PATH!
    echo Please install Python 3 or add it to PATH.
    pause
    exit /b
)

echo Starting Maths for Kid Server...
echo Opening your web browser in 2 seconds...
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:5000"

python app.py

pause
