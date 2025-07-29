#!/usr/bin/env python3
"""
Gmail Credentials Setup Script
Configures Gmail API credentials with the provided client ID
"""

import json
import os
import sys
from pathlib import Path
from gmail_config_manager import GmailConfigManager


def setup_gmail_credentials():
    """Set up Gmail API credentials with the provided client ID"""
    print("🔧 Setting up Gmail API Credentials")
    print("=" * 50)

    config_manager = GmailConfigManager()

    # Display current configuration
    print(f"Client ID: {config_manager.get_client_id()}")
    print(f"Scopes: {', '.join(config_manager.get_scopes())}")
    print(f"Redirect URIs: {', '.join(config_manager.get_redirect_uris())}")

    # Create credentials template
    print("\n📝 Creating credentials template...")
    if config_manager.create_credentials_template():
        print("✅ Credentials template created")
    else:
        print("❌ Failed to create credentials template")
        return False

    # Check if credentials.json exists
    credentials_file = Path("credentials.json")
    if credentials_file.exists():
        print(f"\n📄 Found existing credentials file: {credentials_file}")

        # Validate existing credentials
        if config_manager.validate_credentials():
            print("✅ Existing credentials are valid")
            return True
        else:
            print("⚠️ Existing credentials need to be updated")

    # Provide setup instructions
    print("\n📋 Setup Instructions:")
    print("1. Go to Google Cloud Console: https://console.cloud.google.com/")
    print("2. Create a new project or select existing one")
    print("3. Enable Gmail API:")
    print("   gcloud services enable gmail.googleapis.com")
    print("4. Go to 'APIs & Services' > 'Credentials'")
    print("5. Click 'Create Credentials' > 'OAuth 2.0 Client IDs'")
    print("6. Configure OAuth consent screen:")
    print("   - User Type: External")
    print("   - App name: Gmail Information Tagging")
    print("   - User support email: your-email@domain.com")
    print("   - Developer contact information: your-email@domain.com")
    print("7. Add these scopes:")
    for scope in config_manager.get_scopes():
        print(f"   - {scope}")
    print("8. Add these redirect URIs:")
    for uri in config_manager.get_redirect_uris():
        print(f"   - {uri}")
    print("9. Download the credentials JSON file")
    print("10. Replace the existing credentials.json with the downloaded file")

    print("\n🔗 OAuth2 Authorization URL:")
    print(config_manager.get_oauth_url())

    print("\n📄 Current credentials.json template:")
    try:
        with open("credentials.json", "r") as f:
            template = json.load(f)
        print(json.dumps(template, indent=2))
    except Exception as e:
        print(f"Error reading credentials template: {e}")

    print("\n" + "=" * 50)
    print("✅ Gmail credentials setup complete!")
    print("Next steps:")
    print("1. Download credentials from Google Cloud Console")
    print("2. Replace credentials.json with the downloaded file")
    print("3. Run: python main.py")

    return True


def validate_setup():
    """Validate the complete setup"""
    print("\n🔍 Validating Setup...")

    config_manager = GmailConfigManager()

    # Check required files
    required_files = ["credentials.json", "encryption.key", ".env"]

    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path} exists")
        else:
            print(f"❌ {file_path} missing")

    # Validate credentials
    if config_manager.validate_credentials():
        print("✅ Gmail credentials are valid")
    else:
        print("❌ Gmail credentials need configuration")

    # Check virtual environment
    if os.path.exists("gmail_env"):
        print("✅ Virtual environment exists")
    else:
        print("❌ Virtual environment missing")

    print("\n🎯 Setup validation complete!")


def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == "validate":
        validate_setup()
    else:
        setup_gmail_credentials()


if __name__ == "__main__":
    main()
