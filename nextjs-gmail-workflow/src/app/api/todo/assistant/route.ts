import { NextRequest, NextResponse } from 'next/server';
import { Ollama } from 'ollama';

const ollama = new Ollama({
  host: 'http://localhost:11434'
});

export async function POST(request: NextRequest) {
  try {
    const { question, selectedEmails, tasks, tone, conversationHistory } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'No question provided' },
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

    console.log('Todo assistant request received:', { 
      question: question?.substring(0, 50) + '...', 
      selectedEmailsCount: selectedEmails?.length || 0,
      tasksCount: tasks?.length || 0,
      tone
    });

    // Build context from selected emails and tasks
    let context = '';
    
    if (selectedEmails && selectedEmails.length > 0) {
      context += '\nSelected Emails:\n';
      selectedEmails.forEach((email: any, index: number) => {
        context += `${index + 1}. Subject: ${email.subject}\n   From: ${email.sender}\n   Content: ${email.snippet || email.body}\n\n`;
      });
    }

    if (tasks && tasks.length > 0) {
      context += '\nCurrent Tasks:\n';
      tasks.forEach((task: any, index: number) => {
        context += `${index + 1}. ${task.title} (${task.type}, ${task.priority}, ${task.status})\n   ${task.description}\n\n`;
      });
    }

    // Build conversation history
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: `You are an AI task management assistant. You help users manage their email-based tasks and workflows. You can:

1. Analyze emails and suggest appropriate actions
2. Help prioritize tasks based on urgency and importance
3. Suggest team assignments and workflows
4. Provide guidance on task management best practices
5. Answer questions about email content and required follow-ups
6. Help create action plans for complex email situations

Always provide practical, actionable advice. Be ${tone || 'professional'} in your tone.`
      }
    ];

    // Add conversation history (limit to last 10 messages)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current question with context
    const fullQuestion = `${question}\n\nContext:${context}`;
    messages.push({
      role: 'user',
      content: fullQuestion
    });

    console.log('Making Ollama API call with', messages.length, 'messages');

    const completion = await ollama.chat({
      model: 'phi3',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    const response = completion.message?.content || 'I apologize, but I couldn\'t process your request.';
    console.log('Ollama response received:', response.substring(0, 100) + '...');

    return NextResponse.json({
      response: response,
      context: {
        selectedEmailsCount: selectedEmails?.length || 0,
        tasksCount: tasks?.length || 0
      }
    });

  } catch (error) {
    console.error('Error processing todo assistant request:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Failed to process assistant request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 