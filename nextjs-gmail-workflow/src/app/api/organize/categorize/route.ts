import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Email {
  id: string;
  subject: string;
  sender: string;
  date: string;
  snippet: string;
  body?: string;
  labels: string[];
  theme?: string;
  category?: string;
}

interface CategorizedEmail extends Email {
  theme: string;
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Invalid emails data' },
        { status: 400 }
      );
    }

    // Process emails in batches to respect token limits
    const batchSize = 10;
    const categorizedEmails: CategorizedEmail[] = [];

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      const emailData = batch.map(email => ({
        id: email.id,
        subject: email.subject,
        sender: email.sender,
        snippet: email.snippet,
        body: email.body || email.snippet
      }));

      const prompt = `
Analyze the following emails and categorize them by theme. For each email, provide:
1. A theme category (work, personal, finance, shopping, travel, health, education, or other)
2. A specific category within that theme

Email data:
${JSON.stringify(emailData, null, 2)}

Respond with a JSON array where each object has:
- id: the email ID
- theme: the main theme category
- category: a specific category within the theme

Example response format:
[
  {
    "id": "email_id",
    "theme": "work",
    "category": "meeting"
  }
]
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an email categorization expert. Analyze emails and categorize them by theme and specific category. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const responseText = completion.choices[0]?.message?.content;
      
      if (responseText) {
        try {
          const categorization = JSON.parse(responseText);
          
          // Merge categorization with original email data
          batch.forEach((email, index) => {
            const categorized = categorization[index];
            if (categorized) {
              categorizedEmails.push({
                ...email,
                theme: categorized.theme || 'other',
                category: categorized.category || 'general'
              });
            } else {
              categorizedEmails.push({
                ...email,
                theme: 'other',
                category: 'general'
              });
            }
          });
        } catch (parseError) {
          console.error('Error parsing OpenAI response:', parseError);
          // Fallback categorization
          batch.forEach(email => {
            categorizedEmails.push({
              ...email,
              theme: 'other',
              category: 'general'
            });
          });
        }
      }
    }

    return NextResponse.json(categorizedEmails);

  } catch (error) {
    console.error('Error categorizing emails:', error);
    return NextResponse.json(
      { error: 'Failed to categorize emails' },
      { status: 500 }
    );
  }
} 