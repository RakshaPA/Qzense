import { Question, Difficulty, QuestionType } from "@/types";
import { v4 as uuidv4 } from "uuid";

export interface GenerateParams {
  topic: string;
  count: number;
  difficulty: Difficulty;
  types: QuestionType[];
  typeCounts?: Record<QuestionType, number>;
  docContent?: string;
}

export async function generateQuestions(params: GenerateParams): Promise<Question[]> {
  const res = await fetch("/api/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Generation failed" }));
    throw new Error(err.message ?? "Generation failed");
  }
  const data = await res.json();
  return (data.questions as Omit<Question, "id">[]).map((q) => ({ ...q, id: uuidv4() }));
}

export function buildGeminiPrompt(p: GenerateParams): string {
  let typeDesc = "";
  if (p.typeCounts && Object.values(p.typeCounts).some(v => v > 0)) {
    const parts = [];
    if (p.typeCounts["mcq"] > 0) parts.push(`${p.typeCounts["mcq"]} multiple-choice questions (4 options A/B/C/D)`);
    if (p.typeCounts["true-false"] > 0) parts.push(`${p.typeCounts["true-false"]} true/false questions`);
    if (p.typeCounts["fill-blank"] > 0) parts.push(`${p.typeCounts["fill-blank"]} fill-in-the-blank questions (use ___ in the question)`);
    typeDesc = parts.join(", ");
  } else {
    typeDesc = p.types.map((t) => {
      if (t === "mcq") return "multiple-choice (4 options A/B/C/D)";
      if (t === "true-false") return "true/false";
      return "fill-in-the-blank (use ___ in the question)";
    }).join(", ");
  }

  const source = p.docContent
    ? `Generate questions ONLY from this document content:\n\n${p.docContent.slice(0, 8000)}`
    : `Generate questions about: "${p.topic}"`;

  return `You are an expert educator creating a quiz for students.
${source}

Requirements:
- Exactly ${p.count} questions total
- Difficulty: ${p.difficulty}
- Types to include: ${typeDesc}

Return ONLY a valid JSON array — no markdown, no preamble.

Each item must follow this exact schema:
{
  "type": "mcq" | "true-false" | "fill-blank",
  "question": "<question text>",
  "options": [{"id": "a","text":"..."},{"id":"b","text":"..."},{"id":"c","text":"..."},{"id":"d","text":"..."}],
  "correctAnswer": "<option id or answer text>",
  "explanation": "<why this answer is correct, 2-3 sentences>",
  "hint": "<a clue that helps without giving away the answer>"
}

True/false: options = [{"id":"true","text":"True"},{"id":"false","text":"False"}], correctAnswer = "true" or "false"
Fill-blank: options = [], correctAnswer = the exact word or phrase that fills the blank

Make questions educationally rich, unambiguous, and well-explained.`;
}

export function getEncouragement(correct: boolean): string {
  const wins = ["Nailed it!", "Spot on!", "You are on fire!", "Exactly right!", "Outstanding!", "Perfect!", "Brilliant!"];
  const near = ["Not this time, you will get the next one!", "Every mistake is a lesson!", "Keep going, you are learning!", "So close! Review the explanation below.", "Shake it off, next question!", "Check the explanation and keep pushing!"];
  const pool = correct ? wins : near;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function confidenceLabel(v: number) {
  return ["Very Unsure", "Unsure", "Neutral", "Confident", "Very Confident"][v - 1] ?? "Neutral";
}

export function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60), s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function generateShareCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function blankQuestion() {
  return {
    id: uuidv4(),
    type: "mcq" as QuestionType,
    question: "",
    options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
    correctAnswer: "a",
    explanation: "",
    hint: "",
  };
}