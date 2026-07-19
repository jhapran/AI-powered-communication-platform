import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, Database, RotateCcw, ShieldCheck, UserRound } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-11 rounded-full transition-colors", on ? "bg-primary" : "bg-white/15")}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
          on ? "left-[22px]" : "left-0.5"
        )}
      />
    </button>
  );
}

function Row({ title, desc, control }: { title: string; desc: string; control: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div>
        <div className="text-sm font-bold">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function Settings() {
  const { user, login, resetWorkspace } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const [privacy, setPrivacy] = useState({
    retention: true,
    audit: true,
    voiceConsent: false,
    avatarConsent: false,
    productEmails: false,
    researchEmails: true,
  });

  const set = (k: keyof typeof privacy) => (v: boolean) => setPrivacy((p) => ({ ...p, [k]: v }));

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile, privacy and workspace preferences.</p>
      </div>

      {/* Profile */}
      <section className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold">
          <UserRound className="h-4 w-4 text-primary" /> Profile
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-input bg-black/20 px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</label>
            <input
              value={user?.email ?? ""}
              disabled
              className="w-full rounded-xl border border-input bg-black/20 px-4 py-3 text-sm text-muted-foreground outline-none"
            />
          </div>
        </div>
        <button
          onClick={() => {
            if (user) login({ ...user, name: name.trim() || user.name });
            setSaved(true);
            setTimeout(() => setSaved(false), 1800);
          }}
          className="btn-gradient mt-4 rounded-xl px-5 py-2.5 text-sm font-bold text-white"
        >
          {saved ? "Saved ✓" : "Save profile"}
        </button>
      </section>

      {/* Privacy */}
      <section className="glass rounded-2xl p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Privacy & AI safety
        </div>
        <p className="mb-2 text-xs text-muted-foreground">Aligned with the Security & Privacy Specification — GDPR readiness, consent and audit logging.</p>
        <div className="divide-y divide-white/5">
          <Row title="30-day data retention" desc="Automatically purge generated assets older than 30 days." control={<Toggle on={privacy.retention} onChange={set("retention")} />} />
          <Row title="Audit logging" desc="Keep an immutable log of exports, shares and AI generations." control={<Toggle on={privacy.audit} onChange={set("audit")} />} />
          <Row title="Voice cloning consent" desc="Required before any voice model of you can be trained (Phase 5)." control={<Toggle on={privacy.voiceConsent} onChange={set("voiceConsent")} />} />
          <Row title="Avatar training consent" desc="Required before a personal avatar can be created (Phase 3)." control={<Toggle on={privacy.avatarConsent} onChange={set("avatarConsent")} />} />
        </div>
      </section>

      {/* Notifications */}
      <section className="glass rounded-2xl p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold">
          <Bell className="h-4 w-4 text-amber-300" /> Notifications
        </div>
        <div className="divide-y divide-white/5">
          <Row title="Product updates" desc="New features, style packs and pipeline improvements." control={<Toggle on={privacy.productEmails} onChange={set("productEmails")} />} />
          <Row title="Research & tips" desc="Occasional prompts and visual-storytelling tips." control={<Toggle on={privacy.researchEmails} onChange={set("researchEmails")} />} />
        </div>
      </section>

      {/* Workspace */}
      <section className="glass rounded-2xl border-red-400/20 p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold">
          <Database className="h-4 w-4 text-red-300" /> Workspace data
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Everything in this prototype lives in your browser's local storage. Resetting restores the three demo projects.
        </p>
        <button
          onClick={() => {
            resetWorkspace();
            navigate("/");
          }}
          className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-2.5 text-sm font-bold text-red-300 transition-colors hover:bg-red-400/20"
        >
          <RotateCcw className="h-4 w-4" /> Reset workspace to demos
        </button>
      </section>
    </div>
  );
}
