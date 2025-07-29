import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

interface Email {
  id: string
  threadId: string
  subject: string
  sender: string
  recipient: string
  date: string
  snippet: string
  labels: string[]
  internalDate: string
  sizeEstimate: number
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('access_token')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const daysBack = parseInt(process.env.DAYS_BACK || '2')
    const maxResults = parseInt(process.env.MAX_RESULTS || '10')

    // Calculate date filter
    const dateAfter = new Date()
    dateAfter.setDate(dateAfter.getDate() - daysBack)
    const dateStr = dateAfter.toISOString().split('T')[0]

    // Get list of email IDs
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=after:${dateStr}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`,
        },
      }
    )

    if (!listResponse.ok) {
      const errorData = await listResponse.text()
      console.error('Gmail API list error:', errorData)
      return NextResponse.json(
        { error: 'Failed to retrieve email list' },
        { status: 500 }
      )
    }

    const listData = await listResponse.json()
    const messages = listData.messages || []

    if (messages.length === 0) {
      return NextResponse.json({
        success: true,
        emails: [],
        total: 0,
      })
    }

    // Get full email details
    const emails: Email[] = []
    
    for (const message of messages) {
      try {
        const emailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken.value}`,
            },
          }
        )

        if (emailResponse.ok) {
          const emailData = await emailResponse.json()
          
          // Extract headers
          const headers = emailData.payload?.headers || []
          const headerMap = headers.reduce((acc: any, header: any) => {
            acc[header.name] = header.value
            return acc
          }, {})

          const email: Email = {
            id: emailData.id,
            threadId: emailData.threadId,
            subject: headerMap.Subject || 'No Subject',
            sender: headerMap.From || 'Unknown',
            recipient: headerMap.To || 'Unknown',
            date: headerMap.Date || 'Unknown',
            snippet: emailData.snippet || '',
            labels: emailData.labelIds || [],
            internalDate: emailData.internalDate,
            sizeEstimate: emailData.sizeEstimate,
          }

          emails.push(email)
        }
      } catch (error) {
        console.error(`Error fetching email ${message.id}:`, error)
        // Continue with other emails
      }
    }

    return NextResponse.json({
      success: true,
      emails,
      total: emails.length,
      daysBack,
      maxResults,
    })
  } catch (error) {
    console.error('Emails API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve emails' },
      { status: 500 }
    )
  }
} 