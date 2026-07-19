import {
  UserCircle2, ScanFace, Database, PenTool, Palette, BadgeCheck, FileSignature, ShieldCheck, Camera,
} from "lucide-react";
import { CapabilityCard, Phase2Header, Phase2Notice } from "@/components/Phase2";

const CAPABILITIES = [
  { icon: Camera, title: "Avatar creation", desc: "Capture 30s of footage or upload photos to train a personal digital avatar." },
  { icon: ScanFace, title: "Face training", desc: "Facial landmark model learns your features, expressions and micro-movements." },
  { icon: Database, title: "Avatar storage", desc: "Encrypted per-user avatar vault — you own the model and can delete it any time." },
  { icon: PenTool, title: "Avatar editing", desc: "Adjust hairstyle, wardrobe, background and framing per storyboard." },
  { icon: Palette, title: "Avatar styles", desc: "Photoreal, stylised 3D, or illustrated — matched to your board's art direction." },
  { icon: BadgeCheck, title: "Identity verification", desc: "Government-ID or live selfie check before any likeness can be trained." },
  { icon: FileSignature, title: "Consent flow", desc: "Explicit recorded consent statement, stored with an audit trail." },
  { icon: ShieldCheck, title: "Safety controls", desc: "No third-party likeness without their consent; watermarking on all avatar output." },
];

const CONSENT_STEPS = [
  { n: 1, t: "Record consent statement", d: "Read a short on-screen script confirming you authorise your likeness." },
  { n: 2, t: "Verify identity", d: "Live selfie match against the footage you provide." },
  { n: 3, t: "Train & review", d: "Preview your avatar and approve it before first use." },
  { n: 4, t: "Stay in control", d: "Pause, re-train or permanently delete your avatar at any time." },
];

export default function Avatars() {
  return (
    <div className="space-y-8">
      <Phase2Header
        icon={UserCircle2}
        title="Avatar Studio"
        subtitle="Personal digital presenters for your storyboards — narrate scenes with your own face and expressions. Phase 3 of the MVP plan, unlocked after the storyboard workflow is validated."
        phase="Phase 3 · Planned"
      />

      <Phase2Notice text="Avatar generation is gated behind identity verification and explicit consent, exactly as specified in the Avatar & Security specs. The storyboard pipeline ships first — this studio activates in a later phase." />

      <div>
        <h2 className="mb-4 text-lg font-bold">Consent-first creation flow</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONSENT_STEPS.map((s) => (
            <div key={s.n} className="glass relative rounded-2xl p-5">
              <div className="btn-gradient mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-extrabold text-white">
                {s.n}
              </div>
              <div className="text-sm font-bold">{s.t}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold">Planned capabilities</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <CapabilityCard key={c.title} {...c} />
          ))}
        </div>
      </div>
    </div>
  );
}
