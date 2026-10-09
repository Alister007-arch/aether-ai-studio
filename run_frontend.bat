@echo off
title Aether AI Studio Launcher
color 0B

echo ============================================================
echo               🚀 Launching Aether AI Studio 🚀
echo ============================================================
echo.
echo Connecting to Gemini 3.7 Flash and ChromaDB...
echo Opening browser at http://localhost:8000
echo.

start "" http://localhost:8000

if exist "my.venv\Scripts\python.exe" (
    "my.venv\Scripts\python.exe" server.py
) else (
    python server.py
)

pause
