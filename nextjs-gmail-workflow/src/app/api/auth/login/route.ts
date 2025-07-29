import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const scopes = process.env.GMAIL_SCOPES || 'https://www.googleapis.com/auth/gmail.readonly'

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Missing Google OAuth configuration' },
      { status: 500 }
    )
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/auth')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', scopes)
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  return NextResponse.redirect(authUrl.toString())
} 