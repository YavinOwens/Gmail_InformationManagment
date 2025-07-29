@echo off
REM Gmail API Workflow - Local Quick Start Script for Windows
REM This script sets up the complete local development environment

echo 🚀 Gmail API Workflow - Local Quick Start
echo ==========================================

REM Check if Python is installed
echo ℹ️ Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8 or higher.
    pause
    exit /b 1
)

REM Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✅ Python %PYTHON_VERSION% detected

REM Check if pip is installed
echo ℹ️ Checking pip installation...
pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip is not installed. Please install pip.
    pause
    exit /b 1
)
echo ✅ pip is available

REM Create virtual environment
echo ℹ️ Creating virtual environment...
if exist "gmail_env" (
    echo ⚠️ Virtual environment already exists
) else (
    python -m venv gmail_env
    echo ✅ Virtual environment created
)

REM Activate virtual environment
echo ℹ️ Activating virtual environment...
call gmail_env\Scripts\activate.bat
echo ✅ Virtual environment activated

REM Install dependencies
echo ℹ️ Installing dependencies...
python -m pip install --upgrade pip
pip install -r local_requirements.txt
pip install -e .
echo ✅ Dependencies installed

REM Run setup script
echo ℹ️ Running automated setup...
python local_setup.py
echo ✅ Automated setup completed

REM Create activation script
echo ℹ️ Creating activation script...
(
echo @echo off
echo echo Activating Gmail API Workflow Environment...
echo call gmail_env\Scripts\activate.bat
echo echo Environment activated!
echo echo.
echo echo To deactivate, run: deactivate
echo echo To run the application: python main.py
echo echo To start development server: make dev
) > activate_local.bat
echo ✅ Activation script created: activate_local.bat

REM Check for credentials file
if not exist "credentials.json" (
    echo ⚠️ credentials.json not found
    echo.
    echo To complete setup, you need to:
    echo 1. Go to Google Cloud Console: https://console.cloud.google.com/
    echo 2. Create a project and enable Gmail API
    echo 3. Create OAuth2 credentials
    echo 4. Download credentials.json and place it in this directory
    echo.
) else (
    echo ✅ credentials.json found
)

REM Show next steps
echo.
echo 🎉 SETUP COMPLETE!
echo ==================
echo.
echo Next steps:
echo 1. Activate the environment:
echo    activate_local.bat
echo.
echo 2. Configure your application:
echo    - Edit .env file with your settings
echo    - Add credentials.json if not already present
echo.
echo 3. Run the application:
echo    python main.py
echo.
echo 4. For development:
echo    make dev
echo.
echo 5. For testing:
echo    make test
echo.
echo Useful commands:
echo   make help          - Show all available commands
echo   make check-env     - Check environment status
echo   make security      - Run security audit
echo   make notebook      - Start Jupyter notebook
echo.

pause 