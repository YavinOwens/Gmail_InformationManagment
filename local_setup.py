#!/usr/bin/env python3
"""
Local Setup Script for Gmail API Workflow
Automates environment setup without Docker dependencies
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from cryptography.fernet import Fernet


class LocalSetup:
    def __init__(self):
        self.project_root = Path.cwd()
        self.venv_name = "gmail_env"
        self.venv_path = self.project_root / self.venv_name

    def check_python_version(self):
        """Check if Python version is compatible"""
        if sys.version_info < (3, 8):
            print("❌ Python 3.8 or higher is required")
            print(f"Current version: {sys.version}")
            sys.exit(1)
        print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

    def create_virtual_environment(self):
        """Create Python virtual environment"""
        if self.venv_path.exists():
            print(f"✅ Virtual environment already exists at {self.venv_path}")
            return

        print(f"Creating virtual environment at {self.venv_path}...")
        try:
            subprocess.run([sys.executable, "-m", "venv", str(self.venv_path)], check=True)
            print("✅ Virtual environment created successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to create virtual environment: {e}")
            sys.exit(1)

    def get_venv_python(self):
        """Get Python executable path for virtual environment"""
        if os.name == "nt":  # Windows
            return self.venv_path / "Scripts" / "python.exe"
        else:  # Unix/Linux/macOS
            return self.venv_path / "bin" / "python"

    def get_venv_pip(self):
        """Get pip executable path for virtual environment"""
        if os.name == "nt":  # Windows
            return self.venv_path / "Scripts" / "pip.exe"
        else:  # Unix/Linux/macOS
            return self.venv_path / "bin" / "pip"

    def install_dependencies(self):
        """Install Python dependencies"""
        pip_path = self.get_venv_pip()

        print("Installing dependencies...")
        try:
            # Upgrade pip first
            subprocess.run([str(pip_path), "install", "--upgrade", "pip"], check=True)

            # Install requirements
            subprocess.run([str(pip_path), "install", "-r", "local_requirements_simple.txt"], check=True)

            # Install package in development mode
            subprocess.run([str(pip_path), "install", "-e", "."], check=True)

            print("✅ Dependencies installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install dependencies: {e}")
            sys.exit(1)

    def setup_environment_file(self):
        """Create .env file from template"""
        env_file = self.project_root / ".env"
        env_example = self.project_root / "env.example"

        if env_file.exists():
            print("✅ .env file already exists")
            return

        if not env_example.exists():
            print("❌ env.example file not found")
            sys.exit(1)

        print("Creating .env file from template...")
        try:
            with open(env_example, "r") as src, open(env_file, "w") as dst:
                dst.write(src.read())
            print("✅ .env file created successfully")
        except Exception as e:
            print(f"❌ Failed to create .env file: {e}")
            sys.exit(1)

    def generate_encryption_key(self):
        """Generate encryption key for secure credential storage"""
        key_file = self.project_root / "encryption.key"

        if key_file.exists():
            print("✅ Encryption key already exists")
            return

        print("Generating encryption key...")
        try:
            key = Fernet.generate_key()
            with open(key_file, "wb") as f:
                f.write(key)
            print("✅ Encryption key generated successfully")
        except Exception as e:
            print(f"❌ Failed to generate encryption key: {e}")
            sys.exit(1)

    def create_directories(self):
        """Create necessary directories"""
        directories = ["logs", "data", "config", "tests"]

        for directory in directories:
            dir_path = self.project_root / directory
            dir_path.mkdir(exist_ok=True)
            print(f"✅ Created directory: {directory}")

    def create_config_files(self):
        """Create configuration files"""
        config_dir = self.project_root / "config"

        # Create logging configuration
        logging_config = config_dir / "logging.json"
        if not logging_config.exists():
            logging_config_content = {
                "version": 1,
                "disable_existing_loggers": False,
                "formatters": {
                    "standard": {"format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"},
                    "detailed": {"format": "%(asctime)s [%(levelname)s] %(name)s:%(lineno)d: %(message)s"},
                },
                "handlers": {
                    "console": {
                        "class": "logging.StreamHandler",
                        "level": "INFO",
                        "formatter": "standard",
                        "stream": "ext://sys.stdout",
                    },
                    "file": {
                        "class": "logging.FileHandler",
                        "level": "DEBUG",
                        "formatter": "detailed",
                        "filename": "logs/gmail_workflow.log",
                        "mode": "a",
                    },
                    "audit": {
                        "class": "logging.FileHandler",
                        "level": "INFO",
                        "formatter": "detailed",
                        "filename": "logs/audit.log",
                        "mode": "a",
                    },
                },
                "loggers": {
                    "gmail_workflow": {"level": "DEBUG", "handlers": ["console", "file"], "propagate": False},
                    "audit": {"level": "INFO", "handlers": ["audit"], "propagate": False},
                },
                "root": {"level": "WARNING", "handlers": ["console"]},
            }

            with open(logging_config, "w") as f:
                json.dump(logging_config_content, f, indent=2)
            print("✅ Created logging configuration")

    def create_activation_script(self):
        """Create activation script for easy environment activation"""
        if os.name == "nt":  # Windows
            script_content = f"""@echo off
echo Activating Gmail API Workflow Environment...
call "{self.venv_path}\\Scripts\\activate.bat"
echo Environment activated!
echo.
echo To deactivate, run: deactivate
echo To run the application: python main.py
"""
            script_path = self.project_root / "activate_env.bat"
        else:  # Unix/Linux/macOS
            script_content = f"""#!/bin/bash
echo "Activating Gmail API Workflow Environment..."
source "{self.venv_path}/bin/activate"
echo "Environment activated!"
echo
echo "To deactivate, run: deactivate"
echo "To run the application: python main.py"
"""
            script_path = self.project_root / "activate_env.sh"
            # Make executable
            os.chmod(script_path, 0o755)

        with open(script_path, "w") as f:
            f.write(script_content)
        print(f"✅ Created activation script: {script_path.name}")

    def print_next_steps(self):
        """Print next steps for the user"""
        print("\n" + "=" * 60)
        print("🎉 LOCAL SETUP COMPLETE!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Activate the virtual environment:")
        if os.name == "nt":  # Windows
            print("   activate_env.bat")
        else:
            print("   source activate_env.sh")
        print("\n2. Configure your Gmail API credentials:")
        print("   - Download credentials.json from Google Cloud Console")
        print("   - Place it in the project root directory")
        print("\n3. Edit .env file with your configuration")
        print("\n4. Run the application:")
        print("   python main.py")
        print("\n5. For development:")
        print("   make dev")
        print("\n6. For testing:")
        print("   make test")
        print("\n" + "=" * 60)

    def run_setup(self):
        """Run complete local setup"""
        print("🚀 Starting Local Setup for Gmail API Workflow")
        print("=" * 60)

        self.check_python_version()
        self.create_virtual_environment()
        self.install_dependencies()
        self.setup_environment_file()
        self.generate_encryption_key()
        self.create_directories()
        self.create_config_files()
        self.create_activation_script()
        self.print_next_steps()


if __name__ == "__main__":
    setup = LocalSetup()
    setup.run_setup()
