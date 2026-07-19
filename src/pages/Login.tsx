import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, Clapperboard, UserCircle2, AudioWaveform, Presentation } from "lucide-react";
import { useApp } from "@/lib/store";
import hero from "@/assets/demo/hero.jpg";

const FEATURES = [
  { icon: Clapperboard, label: "Storyboards" },
  { icon: Presentation, label: "Comics & decks" },
  { icon: UserCircle2, label: "Avatars" },
  { icon: AudioWaveform, label: "Voice & video" },
];

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const doLogin = (asDemo = false) => {
    if (asDemo) {
      login({ name: "Alex Rivera", email: "pranav@expressa.app" });
      navigate("/");
      return;
    }
    if (!name.trim()) return setError("Please enter your name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Please enter a valid email address.");
    if (password.length < 4) return setError("Password must be at least 4 characters.");
    login({ name: name.trim(), email: email.trim() });
    navigate("/");
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Left — form */}
      <div className="grid-bg relative flex items-center justify-center px-6 py-12">
        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="w-full max-w-md">
          <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight">
            Turn <span className="text-gradient">thoughts</span> into visual stories
          </h1>
          <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
            Type an idea — Expressa analyses your intent and emotion, plans a storyboard, and generates expressive
            visuals you can share. No design skills needed.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                className="w-full rounded-xl border border-input bg-white/[0.04] px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ada@example.com"
                type="email"
                className="w-full rounded-xl border border-input bg-white/[0.04] px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
                className="w-full rounded-xl border border-input bg-white/[0.04] px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              onClick={() => doLogin()}
              className="btn-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white transition-all"
            >
              Sign in to workspace <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => doLogin(true)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/[0.08]"
            >
              Explore the demo workspace
            </button>
            <p className="text-center text-xs text-muted-foreground">
              Prototype build — authentication is simulated locally. Nothing leaves your browser.
            </p>
          </div>
        </div>
      </div>

      {/* Right — hero */}
      <div className="relative hidden overflow-hidden lg:block">
        <img src={hero} alt="Thoughts becoming visual stories" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10">
          <div className="mb-5 flex flex-wrap gap-2">
            {FEATURES.map((f, i) => (
              <span
                key={f.label}
                className="anim-fade-slide-up glass flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white"
                style={{ animationDelay: `${0.15 * i + 0.3}s` }}
              >
                <f.icon className="h-3.5 w-3.5 text-cyan-300" /> {f.label}
              </span>
            ))}
          </div>
          <p className="anim-fade-slide-up max-w-lg text-lg font-medium leading-relaxed text-white/90" style={{ animationDelay: "0.9s" }}>
            "Can AI help people communicate their ideas more effectively through visual storytelling?" — that is the
            question this MVP answers.
          </p>
        </div>
      </div>
    </div>
  );
}
