import { NextRequest, NextResponse } from 'next/server';
import { Ollama } from 'ollama';
import { parseAIResponse } from '@/lib/json-helper';

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

interface CategorizedEmail extends Email {
  theme: string;
  category: string;
}

// Helper functions to extract theme and category from task data
function extractThemeFromTask(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('work') || text.includes('meeting') || text.includes('project') || text.includes('client')) {
    return 'work';
  }
  if (text.includes('personal') || text.includes('family') || text.includes('friend')) {
    return 'personal';
  }
  if (text.includes('finance') || text.includes('money') || text.includes('payment') || text.includes('bill')) {
    return 'finance';
  }
  if (text.includes('shopping') || text.includes('purchase') || text.includes('buy')) {
    return 'shopping';
  }
  if (text.includes('travel') || text.includes('trip') || text.includes('flight')) {
    return 'travel';
  }
  if (text.includes('health') || text.includes('medical') || text.includes('doctor')) {
    return 'health';
  }
  if (text.includes('education') || text.includes('course') || text.includes('learning')) {
    return 'education';
  }
  
  return 'other';
}

function extractCategoryFromTask(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('meeting')) return 'meeting';
  if (text.includes('project')) return 'project';
  if (text.includes('client')) return 'client';
  if (text.includes('payment')) return 'payment';
  if (text.includes('purchase')) return 'purchase';
  if (text.includes('trip')) return 'trip';
  if (text.includes('medical')) return 'medical';
  if (text.includes('course')) return 'course';
  
  return 'general';
}

export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json();

    // Check if Ollama is available
    try {
      await ollama.list();
    } catch (error) {
      return NextResponse.json(
        { error: 'Ollama server not available. Please start Ollama with: ollama serve' },
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

      const completion = await ollama.chat({
        model: 'phi3',
        messages: [
          {
            role: 'system',
            content: 'You are an email categorization expert. Analyze emails and categorize them by theme and specific category. Respond only with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = completion.message?.content;
      
      if (responseText) {
        try {
          // Use the helper function to parse the response
          const categorization = parseAIResponse(responseText);
          
          // Merge categorization with original email data
          batch.forEach((email, index) => {
            const categorized = categorization[index];
            if (categorized && categorized.title) {
              // Extract theme and category from the task title/description
              const theme = extractThemeFromTask(categorized.title, categorized.description);
              const category = extractCategoryFromTask(categorized.title, categorized.description);
              
              categorizedEmails.push({
                ...email,
                theme: theme || 'other',
                category: category || 'general'
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
          console.error('Error parsing categorization response:', parseError);
          console.log('Raw response:', responseText);
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