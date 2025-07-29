#!/usr/bin/env python3
"""
Simplified Gmail API Email Retrieval Workflow
Uses a different authentication approach to avoid redirect URI issues.
"""

import os
import json
import pickle
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any

import requests
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
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

class SimpleGmailWorkflow:
    """Simplified Gmail API workflow for email retrieval."""
    
    def __init__(self):
        """Initialize the Gmail workflow."""
        self.credentials_file = 'credentials.json'
        self.token_file = 'token.pickle'
        self.scopes = [
            'https://www.googleapis.com/auth/gmail.readonly'
        ]
        self.service = None
        
        # Email retrieval settings
        self.days_back = 2  # Testing with only 2 days
        self.max_results = 20  # Reduced for testing
        self.output_file = 'retrieved_emails.json'
        
        logger.info(f"Simple Gmail Workflow initialized with {self.days_back} days back, max {self.max_results} results")
    
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
                    
                    # Try different authentication methods
                    try:
                        # Method 1: Try with random port
                        creds = flow.run_local_server(port=0)
                    except Exception as e1:
                        logger.info(f"Method 1 failed: {e1}")
                        try:
                            # Method 2: Try with specific port
                            creds = flow.run_local_server(port=8090)
                        except Exception as e2:
                            logger.info(f"Method 2 failed: {e2}")
                            # Method 3: Manual authorization
                            auth_url, _ = flow.authorization_url()
                            print(f"\n🔗 Please visit this URL to authorize the application:")
                            print(f"{auth_url}")
                            print(f"\n📋 After authorization, enter the authorization code here:")
                            auth_code = input("Authorization code: ").strip()
                            flow.fetch_token(code=auth_code)
                            creds = flow.credentials
                
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
        date_after = datetime.now() - timedelta(days=self.days_back)
        date_str = date_after.strftime('%Y/%m/%d')
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
                        format='metadata',
                        metadataHeaders=['Subject', 'From', 'To', 'Date']
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
            logger.info("Starting Simple Gmail API workflow...")
            
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
    print("🚀 Starting Simple Gmail API Email Retrieval Workflow...")
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    # Initialize and run workflow
    workflow = SimpleGmailWorkflow()
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