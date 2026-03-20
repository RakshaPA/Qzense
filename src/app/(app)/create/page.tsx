"use client";
import { useState, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import {
  Sparkles, PenLine, ChevronLeft, Plus, Trash2, Check,
  Loader2, Globe, Lock, Save, List, Upload, FileText, X,
  ToggleLeft, AlignLeft, ChevronDown, ChevronUp,
} from "lucide-react";
import { useCreationStore } from "@/store";
import { generateQuestions, generateShareCode } from "@/lib/ai";
import { saveQuiz } from "@/lib/supabase";
import { Question, QuestionType, Difficulty, Option } from "@/types";

/* ── Standalone Doc Upload Component ─────────────────────────────────────── */
function DocUpload({ onLoad, onRemove, loaded, filename }: {
  onLoad: (content: string, name: string) => void;
  onRemove: () => void;
  loaded: boolean;
  filename: string;
}) {
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onLoad(content, file.name);
      toast.success(`Loaded: ${file.name}`);
    };
    reader.readAsText(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  if (loaded) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: "var(--green-light)", border: "1px solid var(--green)" }}>
        <div className="flex items-center gap-2" style={{ color: "var(--green)" }}>
          <FileText className="w-5 h-5" />
          <span className="text-sm font-semibold">{filename} loaded</span>
        </div>
        <button onClick={onRemove}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
          style={{ background: "var(--red-light)", color: "var(--red)", border: "1px solid var(--red)" }}>
          <X className="w-3.5 h-3.5" /> Remove
        </button>
      </div>
    );
  }

  return (
    <label
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="block rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all"
      style={{
        borderColor: dragging ? "var(--blue)" : "var(--border)",
        background: dragging ? "var(--blue-light)" : "var(--bg-subtle)",
      }}>
      <input type="file" accept=".txt" className="hidden" onChange={handleChange} />
      <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Drop a .txt file or click to browse</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Questions will be based on document content</p>
    </label>
  );
}

const DIFFICULTIES: { v: Difficulty; label: string; color: string }[] = [
  { v: "easy",   label: "Easy",   color: "var(--green)" },
  { v: "medium", label: "Medium", color: "var(--amber)" },
  { v: "hard",   label: "Hard",   color: "var(--red)" },
];

const QTYPES: { v: QuestionType; label: string; icon: React.ElementType; desc: string }[] = [
  { v: "mcq",        label: "Multiple Choice", icon: List,       desc: "4 options, one correct" },
  { v: "true-false", label: "True / False",    icon: ToggleLeft, desc: "Simple true or false" },
  { v: "fill-blank", label: "Fill in Blank",   icon: AlignLeft,  desc: "Complete the sentence" },
];

function blankMCQ(): Question {
  return {
    id: uuidv4(), type: "mcq", question: "",
    options: [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }],
    correctAnswer: "a", explanation: "", hint: "",
  };
}
function blankTF(): Question {
  return {
    id: uuidv4(), type: "true-false", question: "",
    options: [{ id: "true", text: "True" }, { id: "false", text: "False" }],
    correctAnswer: "true", explanation: "", hint: "",
  };
}
function blankFill(): Question {
  return {
    id: uuidv4(), type: "fill-blank", question: "",
    options: [], correctAnswer: "", explanation: "", hint: "",
  };
}

/* ── Question Card ────────────────────────────────────────────────────────── */
function QuestionCard({ q, idx, onUpdate, onRemove }: {
  q: Question; idx: number;
  onUpdate: (id: string, u: Partial<Question>) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  const setOpt = (oId: string, text: string) =>
    onUpdate(q.id, { options: q.options.map((o) => o.id === oId ? { ...o, text } : o) });

  const switchType = (t: QuestionType) => {
    let opts: Option[] = q.options;
    if (t === "true-false") opts = [{ id: "true", text: "True" }, { id: "false", text: "False" }];
    else if (t === "mcq") opts = [{ id: "a", text: "" }, { id: "b", text: "" }, { id: "c", text: "" }, { id: "d", text: "" }];
    else opts = [];
    onUpdate(q.id, { type: t, options: opts, correctAnswer: t === "fill-blank" ? "" : opts[0]?.id ?? "" });
  };

  const typeColor = { mcq: "var(--blue)", "true-false": "var(--violet)", "fill-blank": "var(--amber)" };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="card overflow-hidden" style={{ borderLeft: `4px solid ${typeColor[q.type]}` }}>
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setOpen(!open)}>
        <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white flex-shrink-0"
          style={{ background: typeColor[q.type] }}>
          {idx + 1}
        </div>
        <p className="flex-1 text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
          {q.question || "Untitled question"}
        </p>
        <span className="badge text-xs hidden sm:inline-flex"
          style={{ background: `color-mix(in srgb, ${typeColor[q.type]} 12%, transparent)`, color: typeColor[q.type] }}>
          {QTYPES.find(t => t.v === q.type)?.label}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(q.id); }}
          className="btn-ghost btn btn-icon" style={{ color: "var(--red)" }}>
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {open
          ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
          : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        }
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-5 space-y-4 border-t" style={{ borderColor: "var(--border-soft)" }}>

              {/* Type selector */}
              <div className="flex gap-2 pt-3 flex-wrap">
                {QTYPES.map(t => (
                  <button key={t.v} onClick={() => switchType(t.v)}
                    className="btn btn-sm flex items-center gap-1.5"
                    style={q.type === t.v
                      ? { background: typeColor[t.v], color: "#fff" }
                      : { background: "var(--bg-subtle)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
                    <t.icon className="w-3 h-3" /> {t.label}
                  </button>
                ))}
              </div>

              {/* Question text */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Question</label>
                <textarea value={q.question} rows={2} onChange={e => onUpdate(q.id, { question: e.target.value })}
                  className="textarea w-full text-sm"
                  placeholder={q.type === "fill-blank" ? "Use ___ for the blank. e.g. The capital of France is ___" : "Enter your question..."} />
              </div>

              {/* MCQ and T/F options */}
              {q.type !== "fill-blank" && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                    Options <span className="font-normal opacity-70">(click circle to mark correct answer)</span>
                  </label>
                  <div className="space-y-2">
                    {q.options.map(o => (
                      <div key={o.id} className="flex items-center gap-2.5">
                        <button onClick={() => onUpdate(q.id, { correctAnswer: o.id })}
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            borderColor: q.correctAnswer === o.id ? "var(--green)" : "var(--border)",
                            background: q.correctAnswer === o.id ? "var(--green)" : "transparent",
                          }}>
                          {q.correctAnswer === o.id && <Check className="w-3 h-3 text-white" />}
                        </button>
                        {q.type === "true-false"
                          ? <div className="input flex-1 text-sm py-2 cursor-default" style={{ background: "var(--bg-subtle)" }}>{o.text}</div>
                          : <input value={o.text} onChange={e => setOpt(o.id, e.target.value)} className="input flex-1 text-sm py-2" placeholder={`Option ${o.id.toUpperCase()}`} />
                        }
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fill blank answer */}
              {q.type === "fill-blank" && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Correct Answer</label>
                  <input value={q.correctAnswer} onChange={e => onUpdate(q.id, { correctAnswer: e.target.value })}
                    className="input text-sm" placeholder="The exact word or phrase that fills the blank" />
                </div>
              )}

              {/* Explanation and Hint */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Explanation</label>
                  <textarea value={q.explanation} rows={2} onChange={e => onUpdate(q.id, { explanation: e.target.value })}
                    className="textarea w-full text-xs" placeholder="Why is this the correct answer?" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>Hint (optional)</label>
                  <textarea value={q.hint ?? ""} rows={2} onChange={e => onUpdate(q.id, { hint: e.target.value })}
                    className="textarea w-full text-xs" placeholder="A clue without giving it away" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main Page ────────────────────────────────────────────────────────────── */
function CreatePageInner() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const manual = searchParams.get("manual") === "true";
  const { state: s, set, setStep, setQuestions, addQuestion, updateQuestion, removeQuestion, reset } = useCreationStore();
  const [saving, setSaving] = useState(false);
  const [docContent, setDocContent] = useState("");
  const [docName, setDocName] = useState("");
  // Safe typeCounts
  const typeCounts = s.typeCounts ?? { mcq: 10, "true-false": 0, "fill-blank": 0 };

  // Auto-select manual if URL param
  useState(() => { if (manual && s.useAI) { set({ useAI: false, questions: [] }); } });

  /* Generate with AI */
  const handleGenerate = async () => {
    if (!s.topic.trim() && !docContent) return toast.error("Enter a topic or upload a document");
    const total = Object.values(typeCounts).reduce((a, b) => a + b, 0);
    const finalCount = total > 0 ? total : s.questionCount;
    set({ isGenerating: true });
    try {
      const qs = await generateQuestions({
        topic: s.topic || "General Knowledge",
        count: finalCount,
        difficulty: s.difficulty,
        types: s.questionTypes,
        typeCounts,
        docContent: docContent || undefined,
      });
      setQuestions(qs);
      setStep("edit");
      toast.success(`Generated ${qs.length} questions!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed. Wait 1 minute and try again.");
    } finally {
      set({ isGenerating: false });
    }
  };

  /* Save quiz */
  const handleSave = async () => {
    if (!user?.id) return;
    if (!s.title.trim()) return toast.error("Please add a quiz title");
    if (s.questions.length === 0) return toast.error("Add at least 1 question");
    const invalid = s.questions.find(q => !q.question.trim() || !q.correctAnswer.trim());
    if (invalid) return toast.error("Every question needs text and a correct answer");
    setSaving(true);
    try {
      await saveQuiz({
        id: uuidv4(), title: s.title, topic: s.topic || s.title,
        difficulty: s.difficulty, questions: s.questions,
        createdBy: user.id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        isPublic: s.isPublic, shareCode: s.isPublic ? generateShareCode() : undefined,
        timeLimit: s.timeLimit,
      });
      reset();
      toast.success("Quiz saved!");
      router.push("/dashboard");
    } catch (e) {
      console.error("Save error:", e);
      toast.error(e instanceof Error ? e.message : "Save failed, please try again");
    }
    finally { setSaving(false); }
  };

  /* Start manual */
  const startManual = () => {
    if (!s.title.trim()) return toast.error("Please add a quiz title first");
    // Reset questions so count doesn't accumulate
    setQuestions([]);
    setStep("edit");
  };

  /* ── SETUP STEP ─────────────────────────────────────────────────────────── */
  if (s.step === "setup") return (
    <div className="p-5 sm:p-8 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>
          Create a Quiz
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Configure and generate your quiz</p>

        {/* AI vs Manual */}
        <div className="grid grid-cols-2 gap-4 mb-7">
          {[
            { ai: true,  icon: Sparkles, label: "AI Generation", desc: "Gemini creates questions for you" },
            { ai: false, icon: PenLine,  label: "Manual",        desc: "Write your own questions" },
          ].map(opt => (
            <button key={String(opt.ai)} onClick={() => set({ useAI: opt.ai })}
              className="p-4 rounded-2xl border-2 text-left transition-all duration-150"
              style={{ borderColor: s.useAI === opt.ai ? "var(--blue)" : "var(--border)", background: s.useAI === opt.ai ? "var(--blue-light)" : "var(--bg-card)" }}>
              <opt.icon className="w-5 h-5 mb-2" style={{ color: s.useAI === opt.ai ? "var(--blue)" : "var(--text-muted)" }} />
              <p className="font-bold text-sm" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{opt.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{opt.desc}</p>
            </button>
          ))}
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>Quiz Title *</label>
            <input value={s.title} onChange={e => set({ title: e.target.value })} className="input" placeholder="e.g. Python Fundamentals" />
          </div>

          {/* Topic (AI only) */}
          {s.useAI && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>Topic</label>
              <input value={s.topic} onChange={e => set({ topic: e.target.value })} className="input" placeholder="e.g. JavaScript async/await" />
            </div>
          )}

          {/* Document upload (AI only) */}
          {s.useAI && (
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text-2)" }}>
                Upload Document <span className="font-normal opacity-60">(optional, .txt)</span>
              </label>
              <DocUpload
                loaded={docContent.length > 0}
                filename={docName}
                onLoad={(content, name) => { setDocContent(content); setDocName(name); }}
                onRemove={() => { setDocContent(""); setDocName(""); toast.success("Document removed"); }}
              />
            </div>
          )}

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-2)" }}>Difficulty</label>
            <div className="flex gap-3">
              {DIFFICULTIES.map(d => (
                <button key={d.v} onClick={() => set({ difficulty: d.v })}
                  className="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all"
                  style={{ borderColor: s.difficulty === d.v ? d.color : "var(--border)", color: s.difficulty === d.v ? d.color : "var(--text-muted)", background: s.difficulty === d.v ? `color-mix(in srgb, ${d.color} 12%, transparent)` : "var(--bg-card)" }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI controls */}
          {s.useAI && (
            <>
              {/* Question types with counts */}
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text-2)" }}>Question Types</label>
                <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                  Set how many of each type. Total: <strong style={{ color: "var(--blue)" }}>{Object.values(typeCounts).reduce((a, b) => a + b, 0)}</strong> questions
                </p>
                <div className="space-y-4">
                  {QTYPES.map(t => (
                    <div key={t.v} className="p-4 rounded-xl" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <t.icon className="w-4 h-4" style={{ color: "var(--blue)" }} />
                          <div>
                            <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{t.label}</span>
                            <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>{t.desc}</span>
                          </div>
                        </div>
                        <span className="text-base font-black" style={{ color: "var(--blue)" }}>
                          {typeCounts[t.v] ?? 0}
                        </span>
                      </div>
                      <input type="range" min={0} max={20} value={typeCounts[t.v] ?? 0}
                        onChange={e => {
                          const val = +e.target.value;
                          const newCounts = { ...typeCounts, [t.v]: val };
                          const activeTypes = (Object.keys(newCounts) as QuestionType[]).filter(k => newCounts[k] > 0);
                          set({ typeCounts: newCounts, questionTypes: activeTypes.length > 0 ? activeTypes : s.questionTypes });
                        }}
                        className="w-full accent-blue-500" />
                      <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        <span>0</span><span>20</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Time limit */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--text-2)" }}>
              Time Limit: <span style={{ color: "var(--blue)" }}>{s.timeLimit === 0 ? "No limit" : `${s.timeLimit} min`}</span>
            </label>
            <input type="range" min={0} max={60} step={5} value={s.timeLimit} onChange={e => set({ timeLimit: +e.target.value })} className="w-full accent-blue-500" />
            <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}><span>None</span><span>60 min</span></div>
          </div>

          {/* Visibility */}
          <div className="flex items-center justify-between p-4 rounded-2xl border" style={{ border: "1.5px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              {s.isPublic ? <Globe className="w-4 h-4" style={{ color: "var(--blue)" }} /> : <Lock className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{s.isPublic ? "Public" : "Private"}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{s.isPublic ? "Share link with anyone" : "Only visible to you"}</p>
              </div>
            </div>
            <button onClick={() => set({ isPublic: !s.isPublic })}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: s.isPublic ? "var(--blue)" : "var(--border)" }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200" style={{ left: s.isPublic ? "26px" : "2px" }} />
            </button>
          </div>

          {/* CTA */}
          {s.useAI ? (
            <button onClick={handleGenerate} disabled={s.isGenerating || (!s.topic.trim() && !docContent)} className="btn-primary btn w-full py-3.5 text-base">
              {s.isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating with Gemini...</> : <><Sparkles className="w-5 h-5" /> Generate Questions</>}
            </button>
          ) : (
            <button onClick={startManual} disabled={!s.title.trim()} className="btn-primary btn w-full py-3.5 text-base">
              <PenLine className="w-5 h-5" /> Start Building Questions
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );

  /* ── EDIT STEP ──────────────────────────────────────────────────────────── */
  return (
    <div className="p-5 sm:p-8 max-w-3xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "'Outfit',sans-serif", color: "var(--text)" }}>{s.title || "Edit Quiz"}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{s.questions.length} question{s.questions.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep("setup")} className="btn-secondary btn btn-sm"><ChevronLeft className="w-3.5 h-3.5" /> Back</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary btn btn-sm">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Title + difficulty */}
      <div className="card p-4 mb-5 flex items-center gap-3">
        <input value={s.title} onChange={e => set({ title: e.target.value })}
          className="flex-1 text-sm font-bold bg-transparent outline-none" style={{ color: "var(--text)" }} placeholder="Quiz title..." />
        <div className="flex gap-1.5">
          {DIFFICULTIES.map(d => (
            <button key={d.v} onClick={() => set({ difficulty: d.v })}
              className="badge text-xs font-semibold"
              style={{ background: s.difficulty === d.v ? `color-mix(in srgb, ${d.color} 15%, transparent)` : "var(--bg-subtle)", color: s.difficulty === d.v ? d.color : "var(--text-muted)", border: `1px solid ${s.difficulty === d.v ? d.color : "var(--border)"}` }}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Questions */}
      <AnimatePresence mode="popLayout">
        {s.questions.map((q, i) => (
          <div key={q.id} className="mb-3">
            <QuestionCard q={q} idx={i} onUpdate={updateQuestion} onRemove={removeQuestion} />
          </div>
        ))}
      </AnimatePresence>

      {/* Add question buttons — templates per type */}
      {!s.useAI && (
        <div className="mb-3">
          <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>Add a question:</p>
          <div className="grid grid-cols-3 gap-3">
            {QTYPES.map(t => (
              <button key={t.v}
                onClick={() => {
                  if (t.v === "mcq") addQuestion(blankMCQ());
                  else if (t.v === "true-false") addQuestion(blankTF());
                  else addQuestion(blankFill());
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-dashed transition-all text-sm font-semibold"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                onMouseEnter={e => { (e.currentTarget).style.borderColor = "var(--blue)"; (e.currentTarget).style.color = "var(--blue)"; (e.currentTarget).style.background = "var(--blue-light)"; }}
                onMouseLeave={e => { (e.currentTarget).style.borderColor = "var(--border)"; (e.currentTarget).style.color = "var(--text-muted)"; (e.currentTarget).style.background = "transparent"; }}>
                <Plus className="w-4 h-4" />
                <t.icon className="w-4 h-4" />
                <span className="text-xs">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add question button for AI generated */}
      {s.useAI && (
        <button onClick={() => addQuestion(blankMCQ())}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed text-sm font-semibold transition-all flex items-center justify-center gap-2 mt-2"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--blue)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--blue)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"; }}>
          <Plus className="w-4 h-4" /> Add Question
        </button>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 glass border-t p-4 z-30" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>{s.questions.length} question{s.questions.length !== 1 ? "s" : ""} ready</p>
          <button onClick={handleSave} disabled={saving} className="btn-primary btn">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save & Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <CreatePageInner />
    </Suspense>
  );
}
