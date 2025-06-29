import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY is missing");
    return NextResponse.json({ error: "OPENROUTER_API_KEY is missing" }, { status: 500 });
  }

  const { prompt } = await req.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is missing" }, { status: 400 });
  }

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct", // OR: "mistralai/mistral-7b-instruct"
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    console.log("🔍 OpenRouter Raw Response:", JSON.stringify(data, null, 2));

    const output = data?.choices?.[0]?.message?.content;

    if (!output) {
      return NextResponse.json({ error: "No response content from AI." }, { status: 500 });
    }

    return NextResponse.json({ response: output });
  } catch (error: any) {
    console.error("❌ OpenRouter API Error:", error?.message || error);
    return NextResponse.json({ error: "OpenRouter API failed" }, { status: 500 });
  }
}
