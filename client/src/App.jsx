import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";

import LoginPage from "./pages/LoginPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import AccountPage from "./pages/AccountPage.jsx";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
          <div className="w-full max-w-[760px] rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h1 className="text-lg font-extrabold">Something went wrong</h1>
            <p className="mt-2 text-sm text-white/70">
              Open DevTools Console to see the full error. Refresh if needed.
            </p>
            <pre className="mt-4 max-h-56 overflow-auto rounded-2xl bg-black/40 p-4 text-xs text-white/80">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-slate-900">
        <Toaster position="top-right" richColors closeButton />
        <AppErrorBoundary>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AppErrorBoundary>
      </div>
    </BrowserRouter>
  );
}
