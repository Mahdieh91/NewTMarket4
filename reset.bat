@echo off
title Restart Services

echo Stopping Redis...
"C:\Program Files\Redis\redis-cli.exe" shutdown 2>nul

echo Stopping Python...
taskkill /F /IM python.exe 2>nul

echo Stopping Node...
taskkill /F /IM node.exe 2>nul

timeout /t 2 /nobreak >nul

echo Starting Redis...
start "Redis" "C:\Program Files\Redis\redis-server.exe"

echo Starting Backend...
cd /d "C:\Users\Fardad\tmarket4\backend"
start "Daphne" cmd /k "venv\Scripts\python -m daphne -p 8000 config.asgi:application"

echo Starting Frontend...
cd /d "C:\Users\Fardad\tmarket4\frontend"
start "Next.js" cmd /k "npm run dev"

echo All services restarted.
pause