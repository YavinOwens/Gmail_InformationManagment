.PHONY: help install test lint format security clean docker-build docker-run setup-env

# Default target
help:
	@echo "Available commands:"
	@echo "  install      - Install dependencies"
	@echo "  setup-env    - Set up environment and generate encryption key"
	@echo "  test         - Run tests with coverage"
	@echo "  lint         - Run linting checks"
	@echo "  format       - Format code with black"
	@echo "  security     - Run security checks"
	@echo "  quality-check - Run all quality checks"
	@echo "  clean        - Clean up generated files"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"
	@echo "  run          - Run the application"

# Install dependencies
install:
	@echo "Installing dependencies..."
	pip install -r requirements.txt
	pip install -e .[dev,web]

# Set up environment
setup-env:
	@echo "Setting up environment..."
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "Created .env file from template"; \
	else \
		echo ".env file already exists"; \
	fi
	@if [ ! -f encryption.key ]; then \
		python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" > encryption.key; \
		echo "Generated encryption key"; \
	else \
		echo "Encryption key already exists"; \
	fi
	@echo "Environment setup complete!"

# Run tests
test:
	@echo "Running tests..."
	pytest --cov=gmail_workflow --cov-report=html --cov-report=term-missing

# Run linting
lint:
	@echo "Running linting checks..."
	flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
	flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

# Format code
format:
	@echo "Formatting code..."
	black . --line-length=127

# Run security checks
security:
	@echo "Running security checks..."
	bandit -r . -f json -o bandit-report.json
	safety check --json --output safety-report.json

# Run all quality checks
quality-check: format lint security test
	@echo "All quality checks completed!"

# Clean up generated files
clean:
	@echo "Cleaning up..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf htmlcov/
	rm -rf .pytest_cache/
	rm -f .coverage
	rm -f bandit-report.json
	rm -f safety-report.json
	rm -f retrieved_emails.json
	rm -f gmail_workflow.log
	rm -f audit.log

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t gmail-workflow .

docker-run:
	@echo "Running Docker container..."
	docker run -p 5000:5000 --env-file .env gmail-workflow

# Run the application
run:
	@echo "Running Gmail workflow application..."
	python main.py

# Development server
dev:
	@echo "Starting development server..."
	FLASK_ENV=development FLASK_DEBUG=1 python -m flask run --host=0.0.0.0 --port=5000

# Docker Compose
compose-up:
	@echo "Starting services with Docker Compose..."
	docker-compose up --build

compose-down:
	@echo "Stopping Docker Compose services..."
	docker-compose down

# Security audit
audit:
	@echo "Running comprehensive security audit..."
	python -c "from gmail_workflow.security.auditor import AuditRunner; AuditRunner().generate_audit_report()"

# Generate documentation
docs:
	@echo "Generating documentation..."
	pydoc-markdown --render-toc --output-file docs/api.md gmail_workflow

# Install pre-commit hooks
install-hooks:
	@echo "Installing pre-commit hooks..."
	pip install pre-commit
	pre-commit install

# Update dependencies
update-deps:
	@echo "Updating dependencies..."
	pip install --upgrade -r requirements.txt
	safety check --update

# Create virtual environment
venv:
	@echo "Creating virtual environment..."
	python -m venv gmail_env
	@echo "Virtual environment created. Activate with:"
	@echo "  source gmail_env/bin/activate  # On macOS/Linux"
	@echo "  gmail_env\\Scripts\\activate     # On Windows" 