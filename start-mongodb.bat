@echo off
title HireHub - MongoDB Service Manager
echo ======================================================================
echo           HireHub - MongoDB Local Database Starter
echo ======================================================================
echo.

:: Check for Administrative privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [i] Requesting Administrator privileges to start MongoDB service...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~dp0start-mongodb.bat\" admin' -Verb RunAs"
    exit /b
)

echo [1/3] Checking MongoDB Service status...
sc query MongoDB | find "RUNNING" >nul
if %errorLevel% == 0 (
    echo.
    echo [OK] MongoDB is ALREADY RUNNING on port 27017!
    goto :success
)

echo [2/3] Starting MongoDB Windows Service (MongoDB)...
net start MongoDB
if %errorLevel% == 0 (
    echo.
    echo [OK] MongoDB service started successfully!
    goto :success
)

echo.
echo [!] Windows Service start encountered an issue.
echo [3/3] Attempting standalone startup...
if exist "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" (
    echo Starting mongod directly on port 27017...
    start "MongoDB Server" "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.3\bin\mongod.cfg"
    timeout /t 3 >nul
    goto :success
)

:failed
echo.
echo [ERROR] Failed to start MongoDB automatically.
echo Please open 'services.msc', find 'MongoDB Server', and click 'Start'.
echo.
pause
exit /b 1

:success
echo.
echo ======================================================================
echo [SUCCESS] MongoDB is now active and listening on port 27017!
echo You can now connect MongoDB Compass to:
echo   mongodb://127.0.0.1:27017
echo.
echo And your HireHub backend will connect automatically.
echo ======================================================================
echo.
if "%1"=="admin" (
    pause
)
