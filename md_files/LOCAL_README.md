# Gmail API Workflow - Local Development

A simplified setup for local development without Docker dependencies. This version focuses on direct Python installation and local development tools.

## 🚀 Quick Start

### 1. One-Command Setup

```bash
# Run the automated setup script
python local_setup.py
```

This will:
- ✅ Check Python version compatibility
- ✅ Create virtual environment (`gmail_env`)
- ✅ Install all dependencies
- ✅ Generate encryption key
- ✅ Create `.env` file from template
- ✅ Set up logging configuration
- ✅ Create activation scripts

### 2. Activate Environment

**On macOS/Linux:**
```bash
source activate_env.sh
```

**On Windows:**
```bash
activate_env.bat
```

### 3. Configure Credentials

1. Download `credentials.json` from Google Cloud Console
2. Place it in the project root directory
3. Edit `.env` file with your settings

### 4. Run the Application

```bash
# Run the main application
python main.py

# Or use the make command
make run
```

## 🛠️ Local Development Commands

### Using Makefile

```bash
# View all available commands
make help

# Set up environment
make setup-env

# Install dependencies
make install

# Run tests
make test

# Format code
make format

# Run security checks
make security

# Start development server
make dev

# Start Jupyter notebook
make notebook

# Check environment
make check-env

# Quick start (setup everything)
make quick-start
```

### Manual Commands

```bash
# Create virtual environment manually
python -m venv gmail_env

# Activate virtual environment
source gmail_env/bin/activate  # macOS/Linux
gmail_env\Scripts\activate     # Windows

# Install dependencies
pip install -r local_requirements.txt
pip install -e .

# Run the application
python main.py

# Run tests
pytest

# Format code
black .

# Security check
bandit -r .
safety check
```

## 📁 Project Structure

```
gmail_information_tagging/
├── gmail_env/                 # Virtual environment
├── logs/                      # Application logs
├── data/                      # Data files
├── config/                    # Configuration files
├── tests/                     # Test files
├── local_setup.py            # Automated setup script
├── local_requirements.txt    # Local dependencies
├── local_makefile           # Local development commands
├── activate_env.sh          # Environment activation (Unix)
├── activate_env.bat         # Environment activation (Windows)
├── .env                     # Environment variables
├── encryption.key           # Encryption key (auto-generated)
└── credentials.json         # Gmail API credentials (you add this)
```

## 🔧 Configuration

### Environment Variables (.env)

```bash
# Gmail API Configuration
CREDENTIALS_FILE=credentials.json
TOKEN_FILE=token.pickle
DAYS_BACK=30
MAX_RESULTS=100

# Security Configuration
ENCRYPTION_KEY_FILE=encryption.key
LOG_LEVEL=INFO

# Application Settings
APP_ENV=development
DEBUG=True
PORT=5000
```

### Logging Configuration

Logs are automatically configured in `config/logging.json`:
- **Console output**: INFO level and above
- **File logs**: `logs/gmail_workflow.log` (DEBUG level)
- **Audit logs**: `logs/audit.log` (INFO level)

## 🧪 Development Tools

### Jupyter Notebook

```bash
# Start Jupyter notebook
make notebook

# Or manually
jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser
```

### Interactive Python

```bash
# Start IPython shell
ipython

# Import and test modules
from gmail_workflow.auth_manager import GmailAuthManager
from gmail_workflow.email_service import GmailEmailService
```

### Testing

```bash
# Run all tests
make test

# Run specific test file
pytest tests/test_auth_manager.py

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=gmail_workflow --cov-report=html
```

## 🔒 Security Features

### Local Security

- **Encrypted credential storage** using Fernet encryption
- **Environment-based configuration** (no hardcoded secrets)
- **Secure logging** without exposing sensitive data
- **Automated security scanning** with Bandit and Safety

### Security Commands

```bash
# Run security audit
make security

# Check for vulnerabilities
safety check

# Audit code for security issues
bandit -r .

# Update dependencies securely
make update-deps
```

## 🐛 Troubleshooting

### Common Issues

**1. Python version too old**
```bash
# Check Python version
python --version

# Install Python 3.8+ if needed
# On macOS: brew install python@3.11
# On Ubuntu: sudo apt install python3.11
```

**2. Virtual environment not activated**
```bash
# Check if virtual environment is active
echo $VIRTUAL_ENV

# Activate manually
source gmail_env/bin/activate  # macOS/Linux
gmail_env\Scripts\activate     # Windows
```

**3. Missing dependencies**
```bash
# Reinstall dependencies
pip install -r local_requirements.txt
pip install -e .
```

**4. Permission errors**
```bash
# Fix file permissions
chmod +x activate_env.sh
chmod +x local_setup.py
```

**5. Gmail API errors**
```bash
# Check credentials
ls -la credentials.json

# Verify .env configuration
cat .env

# Test authentication
python -c "from gmail_workflow.auth_manager import GmailAuthManager; print('Auth test')"
```

### Debug Mode

```bash
# Run with debug logging
LOG_LEVEL=DEBUG python main.py

# Run Flask in debug mode
FLASK_DEBUG=1 make dev
```

## 📊 Monitoring

### Log Files

- **Application logs**: `logs/gmail_workflow.log`
- **Audit logs**: `logs/audit.log`
- **Test logs**: Console output during `make test`

### Health Check

```bash
# Check application status
curl http://localhost:5000/health

# View recent logs
tail -f logs/gmail_workflow.log
```

## 🚀 Deployment Options

### Local Script
```bash
python main.py
```

### Web Application
```bash
make dev
```

### Production
```bash
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 main:app
```

## 📚 Additional Resources

- [Gmail API Workflow Guide](GMAIL_API_WORKFLOW_GUIDE.md): Comprehensive implementation guide
- [Task Breakdown](TASK_BREAKDOWN_GMAIL_API.md): Project management roadmap
- [Google Cloud Console](https://console.cloud.google.com/): Set up Gmail API credentials
- [Gmail API Documentation](https://developers.google.com/gmail/api): Official API reference

## 🤝 Contributing

1. Set up local environment: `make setup-env`
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test: `make test`
4. Run quality checks: `make quality-check`
5. Submit pull request

## 🆘 Support

- **Local Setup Issues**: Run `make check-env` to diagnose
- **Gmail API Issues**: Check credentials and scopes
- **Security Issues**: Run `make security` for audit
- **General Issues**: Check logs in `logs/` directory 