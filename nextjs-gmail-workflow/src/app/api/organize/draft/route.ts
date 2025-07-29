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

export async function POST(request: NextRequest) {
  try {
    const { email, tone, instructions } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Prepare the draft generation prompt
    const prompt = `Generate a professional email draft response based on the following context:

ORIGINAL EMAIL:
Subject: ${email.subject}
From: ${email.sender}
Date: ${email.date}
Content: ${email.body || email.snippet}
Labels: ${email.labels.join(', ')}
Theme: ${email.theme || 'uncategorized'}

TONE REQUIREMENT: ${tone || 'professional'}

USER INSTRUCTIONS: ${instructions || 'Generate a professional response'}

Generate a draft email response that:
1. Is contextually appropriate to the original email
2. Matches the specified tone (${tone || 'professional'})
3. Incorporates any user instructions provided
4. Is well-structured and professional
5. Can be easily edited by the user

Format the response as a complete email draft with appropriate greeting, body, and closing.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email writer. Generate professional, contextual email responses that match the user\'s tone and requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 400
    });

    const draftResponse = completion.choices[0]?.message?.content || 'Unable to generate draft response.';

    return NextResponse.json({
      draftResponse
    });

  } catch (error) {
    console.error('Error generating draft response:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft response' },
      { status: 500 }
    );
  }
} 