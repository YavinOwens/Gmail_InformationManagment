#!/bin/bash

# Gmail API Workflow - Local Quick Start Script
# This script sets up the complete local development environment

set -e  # Exit on any error

echo "🚀 Gmail API Workflow - Local Quick Start"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC} $1"
}

# Check if Python is installed
check_python() {
    print_info "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v python &> /dev/null; then
        PYTHON_CMD="python"
    else
        print_error "Python is not installed. Please install Python 3.8 or higher."
        exit 1
    fi
    
    # Check Python version
    PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | awk '{print $2}')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
        print_error "Python 3.8 or higher is required. Current version: $PYTHON_VERSION"
        exit 1
    fi
    
    print_status "Python $PYTHON_VERSION detected"
}

# Check if pip is installed
check_pip() {
    print_info "Checking pip installation..."
    if ! command -v pip3 &> /dev/null; then
        print_error "pip3 is not installed. Please install pip3."
        exit 1
    fi
    print_status "pip3 is available"
}

# Create virtual environment
create_venv() {
    print_info "Creating virtual environment..."
    if [ -d "gmail_env" ]; then
        print_warning "Virtual environment already exists"
    else
        $PYTHON_CMD -m venv gmail_env
        print_status "Virtual environment created"
    fi
}

# Activate virtual environment
activate_venv() {
    print_info "Activating virtual environment..."
    source gmail_env/bin/activate
    print_status "Virtual environment activated"
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    pip install --upgrade pip
    pip install -r local_requirements_simple.txt
    pip install -e .
    print_status "Dependencies installed"
}

# Run setup script
run_setup() {
    print_info "Running automated setup..."
    $PYTHON_CMD local_setup.py
    print_status "Automated setup completed"
}

# Create activation script
create_activation_script() {
    print_info "Creating activation script..."
    cat > activate_local.sh << 'EOF'
#!/bin/bash
echo "Activating Gmail API Workflow Environment..."
source gmail_env/bin/activate
echo "Environment activated!"
echo
echo "To deactivate, run: deactivate"
echo "To run the application: python main.py"
echo "To start development server: make dev"
EOF
    chmod +x activate_local.sh
    print_status "Activation script created: activate_local.sh"
}

# Check for credentials file
check_credentials() {
    if [ ! -f "credentials.json" ]; then
        print_warning "credentials.json not found"
        echo
        echo "To complete setup, you need to:"
        echo "1. Go to Google Cloud Console: https://console.cloud.google.com/"
        echo "2. Create a project and enable Gmail API"
        echo "3. Create OAuth2 credentials"
        echo "4. Download credentials.json and place it in this directory"
        echo
    else
        print_status "credentials.json found"
    fi
}

# Show next steps
show_next_steps() {
    echo
    echo "🎉 SETUP COMPLETE!"
    echo "=================="
    echo
    echo "Next steps:"
    echo "1. Activate the environment:"
    echo "   source activate_local.sh"
    echo
    echo "2. Configure your application:"
    echo "   - Edit .env file with your settings"
    echo "   - Add credentials.json if not already present"
    echo
    echo "3. Run the application:"
    echo "   python main.py"
    echo
    echo "4. For development:"
    echo "   make dev"
    echo
    echo "5. For testing:"
    echo "   make test"
    echo
    echo "Useful commands:"
    echo "  make help          - Show all available commands"
    echo "  make check-env     - Check environment status"
    echo "  make security      - Run security audit"
    echo "  make notebook      - Start Jupyter notebook"
    echo
}

# Main execution
main() {
    echo "Starting local setup..."
    echo
    
    check_python
    check_pip
    create_venv
    activate_venv
    install_dependencies
    run_setup
    create_activation_script
    check_credentials
    show_next_steps
}

# Run main function
main "$@" 