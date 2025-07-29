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

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { question, email, tone, conversationHistory } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!email || !question) {
      return NextResponse.json(
        { error: 'Email and question are required' },
        { status: 400 }
      );
    }

    // Prepare conversation context
    const systemPrompt = `You are an intelligent email assistant. You help users understand and respond to their emails. 
    
Current email context:
- Subject: ${email.subject}
- From: ${email.sender}
- Date: ${email.date}
- Content: ${email.body || email.snippet}
- Labels: ${email.labels.join(', ')}
- Theme: ${email.theme || 'uncategorized'}
- Category: ${email.category || 'general'}

Tone preference: ${tone}

Provide helpful, contextual responses about the email. Be concise but informative.`;

    // Prepare conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history (limit to last 10 messages to manage token usage)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: AssistantMessage) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current question
    messages.push({
      role: 'user',
      content: question
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t process your request.';

    // Generate a draft response if the question is about responding
    let draftResponse = '';
    if (question.toLowerCase().includes('reply') || question.toLowerCase().includes('respond') || question.toLowerCase().includes('draft')) {
      const draftPrompt = `Based on the email context and the user's request, generate a professional draft response. 
      
Email: ${email.subject} from ${email.sender}
Content: ${email.body || email.snippet}
User request: ${question}
Tone: ${tone}

Generate a draft email response that is:
- Contextually appropriate
- Matches the requested tone
- Professional and well-structured
- Ready to be edited by the user`;

      const draftCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert email writer. Generate professional, contextual email responses.'
          },
          {
            role: 'user',
            content: draftPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 300
      });

      draftResponse = draftCompletion.choices[0]?.message?.content || '';
    }

    return NextResponse.json({
      response,
      draftResponse
    });

  } catch (error) {
    console.error('Error processing assistant request:', error);
    return NextResponse.json(
      { error: 'Failed to process assistant request' },
      { status: 500 }
    );
  }
} 