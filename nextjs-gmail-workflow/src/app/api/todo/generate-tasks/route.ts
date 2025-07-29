import { NextRequest, NextResponse } from 'next/server';
import { Ollama } from 'ollama';
import { parseAIResponse } from '@/lib/json-helper';

const ollama = new Ollama({
  host: 'http://localhost:11434'
});

export async function POST(request: NextRequest) {
  try {
    const { emails, tone } = await request.json();

    if (!emails || emails.length === 0) {
      return NextResponse.json(
        { error: 'No emails provided' },
        { status: 400 }
      );
    }

    // Check if Ollama is available
    try {
      await ollama.list();
    } catch (error) {
      return NextResponse.json(
        { error: 'Ollama server not available. Please start Ollama with: ollama serve' },
        { status: 500 }
      );
    }

    console.log('Generating tasks for', emails.length, 'emails');

    const emailContent = emails.map((email: any) => 
      `Subject: ${email.subject}\nFrom: ${email.sender}\nContent: ${email.snippet || email.body}\n`
    ).join('\n---\n');

    const prompt = `Analyze the following emails and generate actionable tasks. Each email should be treated as a "product" that requires attention.

Emails to analyze:
${emailContent}

Generate tasks with the following structure for each email:
- Response tasks: Tasks that require replying to the email
- Follow-up tasks: Tasks that require following up on actions mentioned in the email
- Team workflow tasks: Tasks that should be delegated to team members
- Action tasks: General actions that need to be taken

For each task, provide:
- title: A clear, actionable title
- description: Detailed description of what needs to be done
- type: One of "response", "follow-up", "team-workflow", or "action"
- priority: One of "low", "medium", "high", or "urgent" based on email content and sender importance
- assignedTo: Suggest team member or "self" for personal tasks
- dueDate: Suggested due date (format: YYYY-MM-DD)

CRITICAL JSON REQUIREMENTS:
1. Return ONLY a valid JSON array - no markdown, no explanations, no additional text
2. ALL property names MUST be in double quotes: "title", "description", "type", "priority", "assignedTo", "dueDate"
3. ALL string values MUST be in double quotes: "high", "self", "2024-07-30"
4. Use proper JSON syntax with commas between properties
5. Do NOT use single quotes or unquoted values
6. Do NOT include trailing commas
7. Ensure all dates are in YYYY-MM-DD format

Example format:
[
  {
    "title": "Reply to client inquiry",
    "description": "Respond to the client's question about project timeline",
    "type": "response",
    "priority": "high",
    "assignedTo": "self",
    "dueDate": "2024-07-30"
  }
]

Generate 2-4 tasks per email, focusing on the most important actions needed. Return ONLY the JSON array with proper double quotes and valid JSON syntax.`;

    const completion = await ollama.chat({
      model: 'phi3',
      messages: [
        {
          role: 'system',
          content: `You are an AI task manager that analyzes emails and creates actionable tasks. You understand business workflows and can prioritize tasks based on email content, sender importance, and urgency. Always respond with valid JSON.`
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
        const tasks = parseAIResponse(responseText);
        
        console.log('Generated', tasks.length, 'tasks');
        
        return NextResponse.json({
          tasks: tasks,
          message: `Successfully generated ${tasks.length} tasks from ${emails.length} emails`
        });
      } catch (parseError) {
        console.error('Error parsing task response:', parseError);
        console.log('Raw response:', responseText);
        console.log('Response length:', responseText ? responseText.length : 0);
        console.log('First 500 chars:', responseText ? responseText.substring(0, 500) : '');
        console.log('Last 500 chars:', responseText ? responseText.substring(Math.max(0, responseText.length - 500)) : '');
        
        return NextResponse.json(
          { 
            error: 'Failed to parse AI response into valid tasks',
            details: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
            responsePreview: responseText ? responseText.substring(0, 200) + '...' : 'No response'
          },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'No response generated from AI' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error generating tasks:', error);
    return NextResponse.json(
      { error: 'Failed to generate tasks', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 