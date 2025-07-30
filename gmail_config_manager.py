#!/usr/bin/env python3
"""
Gmail Configuration Manager
Handles Gmail API configuration including client ID and credentials
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional
import logging


class GmailConfigManager:
    def __init__(self, config_dir: str = "config"):
        self.config_dir = Path(config_dir)
        self.config_file = self.config_dir / "gmail_config.json"
        self.credentials_template = self.config_dir / "credentials_template.json"
        self.logger = logging.getLogger(__name__)

    def load_config(self) -> Dict[str, Any]:
        """Load Gmail configuration from file"""
        try:
            with open(self.config_file, "r") as f:
                config = json.load(f)
            self.logger.info("Gmail configuration loaded successfully")
            return config
        except FileNotFoundError:
            self.logger.warning(f"Config file not found: {self.config_file}")
            return self.get_default_config()
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in config file: {e}")
            return self.get_default_config()

    def get_default_config(self) -> Dict[str, Any]:
        """Get default configuration with the provided client ID"""
        return {
            "gmail_api": {
                "client_id": os.getenv('GOOGLE_CLIENT_ID', 'YOUR_CLIENT_ID_HERE'),
                "scopes": ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.modify"],
                "redirect_uris": ["http://localhost:8080", "urn:ietf:wg:oauth:2.0:oob"],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            },
            "application": {
                "name": "Gmail Information Tagging",
                "version": "1.0.0",
                "description": "Secure Gmail API workflow for email retrieval and information tagging",
            },
            "security": {"encryption_enabled": True, "audit_logging": True, "gdpr_compliance": True},
            "defaults": {"days_back": 30, "max_results": 100, "rate_limit": 1000, "rate_limit_window": 3600},
        }

    def get_client_id(self) -> str:
        """Get the Gmail client ID"""
        config = self.load_config()
        return config["gmail_api"]["client_id"]

    def get_scopes(self) -> list:
        """Get Gmail API scopes"""
        config = self.load_config()
        return config["gmail_api"]["scopes"]

    def get_redirect_uris(self) -> list:
        """Get OAuth2 redirect URIs"""
        config = self.load_config()
        return config["gmail_api"]["redirect_uris"]

    def create_credentials_template(self, client_secret: str = None) -> bool:
        """Create credentials.json template with the provided client ID"""
        try:
            template = {
                "installed": {
                    "client_id": self.get_client_id(),
                    "project_id": "gmail-information-tagging",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_secret": client_secret or "YOUR_CLIENT_SECRET_HERE",
                    "redirect_uris": self.get_redirect_uris(),
                }
            }

            # Save template
            with open(self.credentials_template, "w") as f:
                json.dump(template, f, indent=2)

            # Create credentials.json if it doesn't exist
            credentials_file = Path("credentials.json")
            if not credentials_file.exists():
                with open(credentials_file, "w") as f:
                    json.dump(template, f, indent=2)
                self.logger.info("Created credentials.json template")

            self.logger.info("Credentials template created successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to create credentials template: {e}")
            return False

    def validate_credentials(self, credentials_file: str = "credentials.json") -> bool:
        """Validate that credentials.json exists and has the correct client ID"""
        try:
            if not os.path.exists(credentials_file):
                self.logger.warning(f"Credentials file not found: {credentials_file}")
                return False

            with open(credentials_file, "r") as f:
                credentials = json.load(f)

            expected_client_id = self.get_client_id()
            actual_client_id = credentials.get("installed", {}).get("client_id")

            if actual_client_id != expected_client_id:
                self.logger.warning(f"Client ID mismatch. Expected: {expected_client_id}, Found: {actual_client_id}")
                return False

            if credentials.get("installed", {}).get("client_secret") == "YOUR_CLIENT_SECRET_HERE":
                self.logger.warning("Client secret not configured")
                return False

            self.logger.info("Credentials validation passed")
            return True

        except Exception as e:
            self.logger.error(f"Credentials validation failed: {e}")
            return False

    def get_oauth_url(self) -> str:
        """Generate OAuth2 authorization URL"""
        client_id = self.get_client_id()
        scopes = " ".join(self.get_scopes())
        redirect_uri = self.get_redirect_uris()[0]

        return (
            f"https://accounts.google.com/o/oauth2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope={scopes}&"
            f"response_type=code&"
            f"access_type=offline"
        )

    def print_setup_instructions(self):
        """Print setup instructions for the user"""
        print("\n" + "=" * 60)
        print("🔧 GMAIL API SETUP INSTRUCTIONS")
        print("=" * 60)
        print(f"\nClient ID: {self.get_client_id()}")
        print(f"Scopes: {', '.join(self.get_scopes())}")
        print(f"Redirect URIs: {', '.join(self.get_redirect_uris())}")

        print("\n📋 Setup Steps:")
        print("1. Go to Google Cloud Console: https://console.cloud.google.com/")
        print("2. Create a new project or select existing one")
        print("3. Enable Gmail API: gcloud services enable gmail.googleapis.com")
        print("4. Go to 'APIs & Services' > 'Credentials'")
        print("5. Click 'Create Credentials' > 'OAuth 2.0 Client IDs'")
        print("6. Configure OAuth consent screen:")
        print("   - User Type: External")
        print("   - App name: Gmail Information Tagging")
        print("   - User support email: your-email@domain.com")
        print("   - Developer contact information: your-email@domain.com")
        print("7. Add scopes:")
        for scope in self.get_scopes():
            print(f"   - {scope}")
        print("8. Download credentials JSON file")
        print("9. Place it in project root as 'credentials.json'")
        print("10. Edit credentials.json and add your client secret")

        print("\n🔗 OAuth2 Authorization URL:")
        print(self.get_oauth_url())

        print("\n" + "=" * 60)


def main():
    """Main function to demonstrate configuration manager"""
    config_manager = GmailConfigManager()

    # Load and display configuration
    config = config_manager.load_config()
    print("Gmail Configuration:")
    print(json.dumps(config, indent=2))

    # Create credentials template
    config_manager.create_credentials_template()

    # Validate credentials
    if config_manager.validate_credentials():
        print("✅ Credentials are valid")
    else:
        print("❌ Credentials need to be configured")
        config_manager.print_setup_instructions()


if __name__ == "__main__":
    main()
