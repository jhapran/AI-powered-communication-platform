import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Wand2,
  MessagesSquare,
  UserCircle2,
  AudioWaveform,
  Clapperboard,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  Menu,
  X,
  Plus,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/create", label: "Storyboard Studio", icon: Wand2 },
  { to: "/chat", label: "AI Chat", icon: MessagesSquare },
  { to: "/avatars", label: "Avatars", icon: UserCircle2, phase: 2 },
  { to: "/voices", label: "Voices", icon: AudioWaveform, phase: 2 },
  { to: "/video", label: "Video Studio", icon: Clapperboard, phase: 2 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout, projects } = useApp();
  const navigate = useNavigate();
  const composedCount = projects.filter((p) => p.status === "composed" || p.status === "generated").length;
  const creditsUsed = projects.reduce((acc, p) => acc + p.scenes.length, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <div className="btn-gradient flex h-10 w-10 items-center justify-center rounded-xl shadow-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-[17px] font-extrabold tracking-tight text-white">Expressa</div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">AI Expression Platform</div>
        </div>
      </div>

      <button
        onClick={() => {
          navigate("/create");
          onNavigate?.();
        }}
        className="btn-gradient mx-4 mb-5 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all"
      >
        <Plus className="h-4 w-4" /> New Storyboard
      </button>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-white shadow-[inset_0_0_0_1px_hsl(247_85%_67%/0.35)]"
                  : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.phase && (
              <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                P2
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">Generation credits</span>
          <span className="font-bold text-white">{creditsUsed}/200</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="btn-gradient h-full rounded-full transition-all"
            style={{ width: `${Math.min(100, (creditsUsed / 200) * 100)}%` }}
          />
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">{composedCount} storyboards published</div>
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
        <div className="btn-gradient flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
          {user?.name?.[0]?.toUpperCase() ?? "U"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{user?.name ?? "User"}</div>
          <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          title="Sign out"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-sidebar-border bg-sidebar-background lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-background/80 px-4 py-3 backdrop-blur-md lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="btn-gradient flex h-8 w-8 items-center justify-center rounded-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-extrabold tracking-tight">Expressa</span>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-sidebar-border bg-sidebar-background">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 hover:bg-white/10">
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <main className="lg:pl-72">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
