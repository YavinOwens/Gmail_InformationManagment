#!/usr/bin/env python3
"""
Gmail API Email Retrieval Workflow
Retrieves emails from Gmail API and stores them locally for review.
"""

import os
import json
import pickle
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

import requests
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/gmail_workflow.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class GmailWorkflow:
    """Main Gmail API workflow for email retrieval and processing."""
    
    def __init__(self):
        """Initialize the Gmail workflow."""
        self.credentials_file = os.getenv('CREDENTIALS_FILE', 'credentials.json')
        self.token_file = os.getenv('TOKEN_FILE', 'token.pickle')
        self.scopes = [
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/gmail.modify'
        ]
        self.service = None
        self.encryption_key_file = os.getenv('ENCRYPTION_KEY_FILE', 'encryption.key')
        
        # Email retrieval settings
        self.days_back = int(os.getenv('DAYS_BACK', '30'))
        self.max_results = int(os.getenv('MAX_RESULTS', '100'))
        self.output_file = os.getenv('OUTPUT_FILE', 'retrieved_emails.json')
        
        logger.info(f"Gmail Workflow initialized with {self.days_back} days back, max {self.max_results} results")
    
    def load_encryption_key(self) -> bytes:
        """Load encryption key for secure credential handling."""
        try:
            with open(self.encryption_key_file, 'rb') as key_file:
                return key_file.read()
        except FileNotFoundError:
            logger.error(f"Encryption key file not found: {self.encryption_key_file}")
            raise
    
    def authenticate(self) -> bool:
        """Authenticate with Gmail API using OAuth2."""
        try:
            creds = None
            
            # Load existing token if available
            if os.path.exists(self.token_file):
                with open(self.token_file, 'rb') as token:
                    creds = pickle.load(token)
            
            # If no valid credentials available, let user log in
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    logger.info("Refreshing expired credentials...")
                    creds.refresh(Request())
                else:
                    logger.info("Starting OAuth2 authentication flow...")
                    flow = InstalledAppFlow.from_client_secrets_file(
                        self.credentials_file, self.scopes)
                    # Use a different port that's likely to be available
                    creds = flow.run_local_server(port=8090, open_browser=True)
                
                # Save credentials for next run
                with open(self.token_file, 'wb') as token:
                    pickle.dump(creds, token)
            
            # Build the Gmail service
            self.service = build('gmail', 'v1', credentials=creds)
            logger.info("Successfully authenticated with Gmail API")
            return True
            
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            return False
    
    def get_email_filter(self) -> str:
        """Create Gmail API filter for recent emails."""
        # Calculate date for filter (emails from last N days)
        date_after = datetime.now() - timedelta(days=self.days_back)
        date_str = date_after.strftime('%Y/%m/%d')
        
        # Create filter query
        filter_query = f"after:{date_str}"
        logger.info(f"Using filter: {filter_query}")
        
        return filter_query
    
    def retrieve_emails(self) -> List[Dict[str, Any]]:
        """Retrieve emails from Gmail API."""
        if not self.service:
            logger.error("Gmail service not initialized. Please authenticate first.")
            return []
        
        try:
            filter_query = self.get_email_filter()
            
            # Get list of email IDs
            logger.info("Retrieving email list...")
            results = self.service.users().messages().list(
                userId='me',
                q=filter_query,
                maxResults=self.max_results
            ).execute()
            
            messages = results.get('messages', [])
            logger.info(f"Found {len(messages)} emails to retrieve")
            
            if not messages:
                logger.warning("No emails found matching the criteria")
                return []
            
            # Retrieve full email details
            emails = []
            for i, message in enumerate(messages):
                logger.info(f"Retrieving email {i+1}/{len(messages)}: {message['id']}")
                
                try:
                    email_data = self.service.users().messages().get(
                        userId='me',
                        id=message['id'],
                        format='full'
                    ).execute()
                    
                    # Extract relevant email information
                    email_info = self.extract_email_info(email_data)
                    emails.append(email_info)
                    
                except HttpError as e:
                    logger.error(f"Error retrieving email {message['id']}: {str(e)}")
                    continue
            
            logger.info(f"Successfully retrieved {len(emails)} emails")
            return emails
            
        except HttpError as e:
            logger.error(f"Gmail API error: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error during email retrieval: {str(e)}")
            return []
    
    def extract_email_info(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract relevant information from Gmail API email data."""
        try:
            # Extract headers
            headers = email_data.get('payload', {}).get('headers', [])
            header_dict = {header['name']: header['value'] for header in headers}
            
            # Extract body content
            body = self.extract_email_body(email_data.get('payload', {}))
            
            # Extract labels
            labels = email_data.get('labelIds', [])
            
            # Create email info dictionary
            email_info = {
                'id': email_data.get('id'),
                'threadId': email_data.get('threadId'),
                'subject': header_dict.get('Subject', 'No Subject'),
                'sender': header_dict.get('From', 'Unknown'),
                'recipient': header_dict.get('To', 'Unknown'),
                'date': header_dict.get('Date', 'Unknown'),
                'body': body,
                'labels': labels,
                'snippet': email_data.get('snippet', ''),
                'internalDate': email_data.get('internalDate'),
                'sizeEstimate': email_data.get('sizeEstimate')
            }
            
            return email_info
            
        except Exception as e:
            logger.error(f"Error extracting email info: {str(e)}")
            return {
                'id': email_data.get('id', 'unknown'),
                'error': f"Failed to extract email info: {str(e)}"
            }
    
    def extract_email_body(self, payload: Dict[str, Any]) -> str:
        """Extract email body content from Gmail API payload."""
        try:
            # Handle multipart messages
            if 'parts' in payload:
                body = ""
                for part in payload['parts']:
                    if part.get('mimeType') == 'text/plain':
                        body_data = part.get('body', {}).get('data', '')
                        if body_data:
                            import base64
                            body += base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')
                return body
            
            # Handle simple text messages
            elif payload.get('mimeType') == 'text/plain':
                body_data = payload.get('body', {}).get('data', '')
                if body_data:
                    import base64
                    return base64.urlsafe_b64decode(body_data).decode('utf-8', errors='ignore')
            
            return "Email body not available"
            
        except Exception as e:
            logger.error(f"Error extracting email body: {str(e)}")
            return "Error extracting email body"
    
    def save_emails(self, emails: List[Dict[str, Any]]) -> None:
        """Save retrieved emails to JSON file."""
        try:
            output_data = {
                'retrieval_date': datetime.now().isoformat(),
                'total_emails': len(emails),
                'days_back': self.days_back,
                'max_results': self.max_results,
                'emails': emails
            }
            
            with open(self.output_file, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(emails)} emails to {self.output_file}")
            
        except Exception as e:
            logger.error(f"Error saving emails: {str(e)}")
    
    def print_summary(self, emails: List[Dict[str, Any]]) -> None:
        """Print a summary of retrieved emails."""
        print("\n" + "="*60)
        print("📧 GMAIL EMAIL RETRIEVAL SUMMARY")
        print("="*60)
        print(f"📊 Total emails retrieved: {len(emails)}")
        print(f"📅 Date range: Last {self.days_back} days")
        print(f"📁 Output file: {self.output_file}")
        print(f"📝 Log file: logs/gmail_workflow.log")
        
        if emails:
            print("\n📋 EMAIL SAMPLES:")
            for i, email in enumerate(emails[:5]):  # Show first 5 emails
                print(f"\n{i+1}. Subject: {email.get('subject', 'No Subject')}")
                print(f"   From: {email.get('sender', 'Unknown')}")
                print(f"   Date: {email.get('date', 'Unknown')}")
                print(f"   Labels: {', '.join(email.get('labels', []))}")
                print(f"   Snippet: {email.get('snippet', '')[:100]}...")
        
        print("\n" + "="*60)
    
    def run(self) -> bool:
        """Run the complete Gmail workflow."""
        try:
            logger.info("Starting Gmail API workflow...")
            
            # Step 1: Authenticate
            if not self.authenticate():
                logger.error("Authentication failed. Cannot proceed.")
                return False
            
            # Step 2: Retrieve emails
            emails = self.retrieve_emails()
            
            # Step 3: Save emails
            if emails:
                self.save_emails(emails)
                self.print_summary(emails)
                return True
            else:
                logger.warning("No emails retrieved. Check your filter criteria.")
                return False
                
        except Exception as e:
            logger.error(f"Workflow failed: {str(e)}")
            return False

def main():
    """Main entry point for the Gmail workflow."""
    print("🚀 Starting Gmail API Email Retrieval Workflow...")
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Initialize and run workflow
    workflow = GmailWorkflow()
    success = workflow.run()
    
    if success:
        print("\n✅ Workflow completed successfully!")
        print(f"📧 Check {workflow.output_file} for retrieved emails")
        print(f"📝 Check logs/gmail_workflow.log for detailed logs")
    else:
        print("\n❌ Workflow failed. Check logs for details.")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main()) 