import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Storyboard, UserProfile } from "@/types";
import { buildDemoProjects } from "@/data/demo";

const USER_KEY = "expressa:user";
const PROJECTS_KEY = "expressa:projects";

interface AppState {
  user: UserProfile | null;
  projects: Storyboard[];
  draftThought: string;
  login: (u: UserProfile) => void;
  logout: () => void;
  saveProject: (p: Storyboard) => void;
  getProject: (id: string) => Storyboard | undefined;
  deleteProject: (id: string) => void;
  setDraftThought: (t: string) => void;
  resetWorkspace: () => void;
}

const Ctx = createContext<AppState | null>(null);

function loadProjects(): Storyboard[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Storyboard[];
      if (Array.isArray(parsed) && parsed.length) {
        // Re-hydrate demo image URLs (they are bundle paths, not persisted)
        const demos = buildDemoProjects();
        return parsed.map((p) => {
          const demo = demos.find((d) => d.id === p.id);
          if (demo) {
            return {
              ...p,
              scenes: p.scenes.map((s, i) => ({ ...s, imageUrl: demo.scenes[i]?.imageUrl ?? s.imageUrl })),
            };
          }
          return p;
        });
      }
    }
  } catch {
    /* ignore */
  }
  return buildDemoProjects();
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch {
      return null;
    }
  });
  const [projects, setProjects] = useState<Storyboard[]>(loadProjects);
  const [draftThought, setDraftThought] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    } catch {
      /* storage full — ignore */
    }
  }, [projects]);

  const login = useCallback((u: UserProfile) => {
    setUser(u);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
  }, []);

  const saveProject = useCallback((p: Storyboard) => {
    setProjects((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      const next = idx >= 0 ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      return next;
    });
  }, []);

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resetWorkspace = useCallback(() => {
    const demos = buildDemoProjects();
    setProjects(demos);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(demos));
  }, []);

  const value = useMemo(
    () => ({ user, projects, draftThought, login, logout, saveProject, getProject, deleteProject, setDraftThought, resetWorkspace }),
    [user, projects, draftThought, login, logout, saveProject, getProject, deleteProject, resetWorkspace]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
