import { NextRequest, NextResponse } from "next/server";
import { GenerateParams } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const params: GenerateParams = await req.json();

    const prompt = `Create ${params.count} quiz questions about "${params.topic}" difficulty: ${params.difficulty}.

Return ONLY a JSON array. No markdown. No extra text. Keep explanations short (max 10 words).

Example format:
[{"type":"mcq","question":"What is 2+2?","options":[{"id":"a","text":"3"},{"id":"b","text":"4"},{"id":"c","text":"5"},{"id":"d","text":"6"}],"correctAnswer":"b","explanation":"2 plus 2 equals 4.","hint":"Basic math."}]`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a JSON API. Output only valid JSON arrays. No markdown, no extra text. Keep all text values short and concise." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 6000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message ?? `API error: ${response.status}`);
    }

    let raw = data.choices?.[0]?.message?.content ?? "";
    raw = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("No JSON array found in response");
    raw = raw.slice(start, end + 1);

    let questions;
    try {
      questions = JSON.parse(raw);
    } catch {
      // Try to fix truncated JSON by finding last complete object
      const lastComplete = raw.lastIndexOf("},");
      if (lastComplete !== -1) {
        try {
          questions = JSON.parse(raw.slice(0, lastComplete + 1) + "]");
        } catch {
          throw new Error("Could not parse AI response. Please try again.");
        }
      } else {
        throw new Error("Could not parse AI response. Please try again.");
      }
    }

    if (!Array.isArray(questions)) throw new Error("Invalid response format.");

    const clean = questions
      .slice(0, params.count)
      .filter((q: Record<string, unknown>) => q.question && q.correctAnswer)
      .map((q: Record<string, unknown>) => ({
        type: q.type ?? "mcq",
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? "No explanation provided.",
        hint: q.hint ?? "",
      }));

    if (clean.length === 0) throw new Error("No valid questions generated. Please try again.");

    return NextResponse.json({ questions: clean });
  } catch (err) {
    console.error("Generate error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
