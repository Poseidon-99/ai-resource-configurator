import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Updated interfaces to match your exact Excel column names
interface Client {
  CLIENT_ID: string;
  CLIENT_NAME: string;
  PRIORITY: string;
  REQUESTED_TASKS: string;
}

interface Worker {
  WORKER_ID: string;
  WORKER_NAME: string;
  SKILLS: string;
  AVAILABLE_SLOTS: string;
  MAX_LOAD: string;
  GROUP: string;
  QUALIFICATION: string;
}

interface Task {
  TASK_ID: string;
  TASK_NAME: string;
  CATEGORY: string;
  DURATION: string;
  REQUIRED_SKILLS: string;
  PREFERRED_PHASES: string;
  MAX_CONCURRENT: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, clients, workers, tasks } = body;

    // Validate required data
    if (!prompt || !clients || !workers || !tasks) {
      return NextResponse.json(
        { error: 'Missing required data: prompt, clients, workers, or tasks' },
        { status: 400 }
      );
    }

    // Format data for AI analysis
    const dataContext = `
CLIENTS DATA:
${clients.map((c: Client) => 
  `ID: ${c.CLIENT_ID}, Name: ${c.CLIENT_NAME}, Priority: ${c.PRIORITY}, Tasks: ${c.REQUESTED_TASKS}`
).join('\n')}

WORKERS DATA:
${workers.map((w: Worker) => 
  `ID: ${w.WORKER_ID}, Name: ${w.WORKER_NAME}, Skills: ${w.SKILLS}, Slots: ${w.AVAILABLE_SLOTS}, Max Load: ${w.MAX_LOAD}, Group: ${w.GROUP}, Qualification: ${w.QUALIFICATION}`
).join('\n')}

TASKS DATA:
${tasks.map((t: Task) => 
  `ID: ${t.TASK_ID}, Name: ${t.TASK_NAME}, Category: ${t.CATEGORY}, Duration: ${t.DURATION}, Skills: ${t.REQUIRED_SKILLS}, Phases: ${t.PREFERRED_PHASES}, Max Concurrent: ${t.MAX_CONCURRENT}`
).join('\n')}
    `;

    // Create AI prompt for analysis
    const systemPrompt = `You are an expert data analyst specializing in workforce management and task allocation. 
    Analyze the provided data and respond to user queries with specific, actionable insights.
    Focus on matching workers to tasks based on skills, availability, and client priorities.
    Provide concrete recommendations with supporting data.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `${dataContext}\n\nUser Query: ${prompt}\n\nPlease analyze this data and provide specific insights and recommendations.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('AI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured properly' },
          { status: 500 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process AI request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}