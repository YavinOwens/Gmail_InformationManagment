import { NextRequest, NextResponse } from 'next/server';
import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: 'http://localhost:11434'
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

    // Check if Ollama is available
    try {
      await ollama.list();
    } catch (error) {
      return NextResponse.json(
        { error: 'Ollama server not available. Please start Ollama with: ollama serve' },
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

    const completion = await ollama.chat({
      model: 'phi3',
      messages: [
        {
          role: 'system',
          content: 'You are an expert email writer. Generate professional, contextual email responses that match the user\'s tone and requirements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const draftResponse = completion.message?.content || 'Unable to generate draft response.';

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