import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemPrompt = `You are a warm, encouraging AI tutor helping a student during a quiz.
Topic: ${context?.topic ?? "General"}
Current question: ${context?.question ?? "N/A"}
${context?.hint ? `Hint available: ${context.hint}` : ""}
Be friendly, concise, and encouraging. Never reveal the answer directly.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
          })),
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content ?? "Sorry, I could not respond right now.";
    return NextResponse.json({ message });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "I had trouble responding. Please try again!" }, { status: 500 });
  }
}