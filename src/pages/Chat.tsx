import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bot, SendHorizonal, Sparkles, User, Wand2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { analyzeThought, INTENT_LABEL, SAMPLE_THOUGHTS } from "@/lib/aiEngine";
import type { ThoughtAnalysis } from "@/types";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  text: string;
  analysis?: ThoughtAnalysis;
  sourceThought?: string;
}

const OPENING: Msg = {
  role: "assistant",
  text: "Hi! I'm your expression copilot. Paste any thought, pitch or story and I'll analyse its intent and emotion — then hand it to the Storyboard Studio. Try one of the samples below, or just start typing.",
};

export default function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([OPENING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const { setDraftThought } = useApp();
  const navigate = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text }]);
    setTyping(true);

    setTimeout(() => {
      setMsgs((m) => {
        const reply: Msg =
          text.length >= 40
            ? (() => {
                const a = analyzeThought(text);
                return {
                  role: "assistant",
                  text: `Nice — that's a clear **${INTENT_LABEL[a.intent].toLowerCase()}** piece for **${a.audience.toLowerCase()}**. Dominant emotion: ${a.emotions[0].name} (${Math.round(a.emotions[0].score * 100)}%). I'd plan ${a.recommendedScenes} scenes in a ${a.tone.toLowerCase()} tone. Want me to build the storyboard?`,
                  analysis: a,
                  sourceThought: text,
                };
              })()
            : {
                role: "assistant",
                text: "Give me a bit more to work with — a full thought, pitch, explanation or story (40+ characters) and I can detect intent, audience and emotion, then plan a storyboard.",
              };
        return [...m, reply];
      });
      setTyping(false);
    }, 900 + Math.random() * 700);
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">AI Chat</h1>
        <p className="mt-1 text-sm text-muted-foreground">Conversational entry point — the same analysis engine as the studio.</p>
      </div>

      <div className="glass flex-1 space-y-5 overflow-y-auto rounded-2xl p-5">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}>
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                m.role === "assistant" ? "btn-gradient" : "border border-white/15 bg-white/10"
              )}
            >
              {m.role === "assistant" ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4" />}
            </div>
            <div className={cn("max-w-[80%] space-y-3", m.role === "user" && "text-right")}>
              <div
                className={cn(
                  "inline-block rounded-2xl px-4 py-3 text-left text-sm leading-relaxed",
                  m.role === "assistant" ? "rounded-tl-sm bg-white/[0.06]" : "btn-gradient rounded-tr-sm text-white"
                )}
              >
                {m.text.split("**").map((part, j) => (j % 2 === 1 ? <strong key={j}>{part}</strong> : part))}
              </div>

              {m.analysis && (
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-left">
                  <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Sparkles className="h-3 w-3 text-primary" /> Instant analysis
                  </div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {m.analysis.emotions.map((e) => (
                      <span
                        key={e.name}
                        className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                        style={{ background: `${e.color}20`, color: e.color, border: `1px solid ${e.color}44` }}
                      >
                        {e.name} {Math.round(e.score * 100)}%
                      </span>
                    ))}
                    {m.analysis.keywords.slice(0, 4).map((k) => (
                      <span key={k} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
                        #{k}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setDraftThought(m.sourceThought!);
                      navigate("/create");
                    }}
                    className="btn-gradient flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white"
                  >
                    <Wand2 className="h-3.5 w-3.5" /> Open in Storyboard Studio
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-3">
            <div className="btn-gradient flex h-8 w-8 items-center justify-center rounded-full">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/[0.06] px-4 py-3.5">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SAMPLE_THOUGHTS.map((s) => (
          <button
            key={s.id}
            onClick={() => send(s.text)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Paste a thought, pitch or story…"
          className="flex-1 rounded-xl border border-input bg-white/[0.04] px-4 py-3.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button onClick={() => send()} disabled={!input.trim()} className="btn-gradient rounded-xl px-5 text-white disabled:opacity-40">
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
