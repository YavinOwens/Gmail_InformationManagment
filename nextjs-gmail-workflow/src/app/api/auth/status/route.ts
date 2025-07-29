import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('access_token')

    if (!accessToken) {
      return NextResponse.json({ authenticated: false })
    }

    // Verify the token is still valid by making a test request to Gmail API
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
      },
    })

    if (!response.ok) {
      // Token is invalid, clear cookies
      cookieStore.delete('access_token')
      cookieStore.delete('refresh_token')
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ authenticated: true })
  } catch (error) {
    console.error('Auth status check error:', error)
    return NextResponse.json({ authenticated: false })
  }
} 