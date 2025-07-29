# Gmail API Workflow - Next.js Application

A modern web application for retrieving and analyzing Gmail emails using Next.js 14+ and Google OAuth2.

## 🚀 Quick Start

The application is already running at: **http://localhost:3000**

### Prerequisites

- Node.js 18+ 
- Google Cloud Console project with Gmail API enabled
- OAuth2 credentials configured

### Environment Setup

The `.env.local` file has been created with your Google OAuth2 credentials:

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## 🔧 Configuration

### Google Cloud Console Setup

1. **OAuth2 Client Configuration**: Your client is configured as a "Web application"
2. **Redirect URIs**: Make sure these are added to your Google Cloud Console:
   - `http://localhost:3000/api/auth/callback`

### Application Features

- **Modern UI**: Built with Next.js 14+ and Tailwind CSS
- **OAuth2 Authentication**: Secure Google account authentication
- **Email Retrieval**: Fetch emails from the last 2 days
- **Real-time Updates**: Refresh emails without re-authentication
- **Responsive Design**: Works on desktop and mobile

## 📱 Usage

1. **Access the Application**: Open http://localhost:3000
2. **Login**: Click "Login with Google" to authenticate
3. **View Emails**: Browse your recent emails with metadata
4. **Refresh**: Click "Refresh Emails" to get the latest emails
5. **Logout**: Click "Logout" to end your session

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Project Structure

```
nextjs-gmail-workflow/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main UI component
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Global styles
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/        # OAuth2 login endpoint
│   │       │   ├── callback/     # OAuth2 callback handler
│   │       │   ├── logout/       # Logout endpoint
│   │       │   └── status/       # Authentication status
│   │       └── emails/           # Email retrieval endpoint
├── .env.local                    # Environment variables
├── next.config.js               # Next.js configuration
└── package.json                 # Dependencies
```

## 🔐 Security Features

- **HTTP-only Cookies**: Secure token storage
- **OAuth2 Flow**: Industry-standard authentication
- **CORS Headers**: Proper API security
- **Environment Variables**: Secure credential management

## 📊 API Endpoints

- `GET /api/auth/login` - Initiate OAuth2 flow
- `GET /api/auth/callback` - Handle OAuth2 callback
- `POST /api/auth/logout` - End user session
- `GET /api/auth/status` - Check authentication status
- `GET /api/emails` - Retrieve Gmail emails

## 🎯 Key Features

### Authentication Flow
1. User clicks "Login with Google"
2. Redirected to Google OAuth2 consent screen
3. User authorizes the application
4. Redirected back with authorization code
5. Server exchanges code for access/refresh tokens
6. Tokens stored in HTTP-only cookies
7. User can now access Gmail API

### Email Retrieval
- Fetches emails from the last 2 days
- Retrieves metadata (subject, sender, date, labels)
- Displays email snippets
- Shows email labels and categories
- Handles pagination for large email volumes

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid redirect_uri"**: 
   - Ensure `http://localhost:3000/api/auth/callback` is in your Google Cloud Console
   - Check that the client ID matches your credentials

2. **"Access denied"**:
   - Make sure Gmail API is enabled in Google Cloud Console
   - Verify OAuth2 consent screen is configured

3. **"No emails found"**:
   - Check your Gmail filters and labels
   - Verify the date range (last 2 days)
   - Ensure you have emails in your inbox

### Development Commands

```bash
# Check if server is running
curl http://localhost:3000

# View environment variables
cat .env.local

# Check Node.js version
node --version

# Restart development server
npm run dev
```

## 📈 Next Steps

1. **Customize Email Filters**: Modify the date range and search criteria
2. **Add Email Actions**: Implement reply, forward, or delete functionality
3. **Enhanced UI**: Add email composition, search, and sorting features
4. **Data Analytics**: Add email statistics and insights
5. **Deployment**: Deploy to Vercel, Netlify, or other platforms

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Google Gmail API](https://developers.google.com/gmail/api)
- [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Status**: ✅ Application is running successfully at http://localhost:3000
**Configuration**: ✅ OAuth2 credentials configured
**Environment**: ✅ All environment variables set 