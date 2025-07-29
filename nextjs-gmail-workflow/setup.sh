#!/bin/bash

# Gmail API Workflow - Next.js Setup Script
# This script sets up the Next.js application for Gmail API workflow

set -e

echo "🚀 Setting up Gmail API Workflow - Next.js Application"
echo "======================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "Please upgrade Node.js to version 18 or higher."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env.local from template
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local from template..."
    cp env.local .env.local
    echo "✅ Created .env.local"
    echo "⚠️  Please update .env.local with your Google OAuth2 credentials"
else
    echo "✅ .env.local already exists"
fi

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p public
mkdir -p src/components

# Check if TypeScript is working
echo ""
echo "🔍 Checking TypeScript configuration..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript configuration is valid"
else
    echo "❌ TypeScript configuration has errors"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with your Google OAuth2 credentials"
echo "2. Configure Google Cloud Console:"
echo "   - Enable Gmail API"
echo "   - Create OAuth2 credentials (Web application)"
echo "   - Add redirect URI: http://localhost:3000/api/auth/callback"
echo "3. Run the development server:"
echo "   npm run dev"
echo "4. Visit: http://localhost:3000"
echo ""
echo "📚 For detailed instructions, see README.md" 