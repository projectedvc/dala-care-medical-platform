@echo off
setlocal
title Dala Website
cd /d "%~dp0"

where node.exe >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing project dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo Could not install dependencies.
    pause
    exit /b 1
  )
)

set "WRANGLER_LOG_PATH=.wrangler\wrangler.log"
echo.
echo Dala is starting at http://localhost:3000
echo Keep this window open while using the site.
echo Press Ctrl+C to stop it.
echo.

start "" /min powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"
call npm.cmd run dev

endlocal
