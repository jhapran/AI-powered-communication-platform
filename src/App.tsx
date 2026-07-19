import { Navigate, Route, Routes } from "react-router";
import { AppProvider, useApp } from "@/lib/store";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import CreateWizard from "@/pages/create/CreateWizard";
import ProjectView from "@/pages/ProjectView";
import Chat from "@/pages/Chat";
import Avatars from "@/pages/Avatars";
import Voices from "@/pages/Voices";
import Video from "@/pages/Video";
import Settings from "@/pages/Settings";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LoginGate() {
  return <Login />;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<LoginGate />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateWizard />} />
          <Route path="/project/:id" element={<ProjectView />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/avatars" element={<Avatars />} />
          <Route path="/voices" element={<Voices />} />
          <Route path="/video" element={<Video />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProvider>
  );
}
