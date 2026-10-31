@echo off
cd /d "%~dp0"
where py >nul 2>nul || (echo Python launcher not found. Install Python 3.11 and try again. & pause & exit /b 1)
if not exist .venv py -3.11 -m venv .venv
if not exist .venv\Scripts\python.exe (echo Could not create Python 3.11 virtual environment. Install Python 3.11. & pause & exit /b 1)
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
