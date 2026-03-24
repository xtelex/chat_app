import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, LogOut, Trash2, User } from "lucide-react";

import { isSupabaseConfigured, supabase } from "../services/supabaseClient.js";

export default function AccountPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const providers = useMemo(() => {
    const p = user?.app_metadata?.providers;
    return Array.isArray(p) ? p : [];
  }, [user]);

  const avatarUrl = user?.user_metadata?.avatar_url || "";

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const nextSession = data.session ?? null;
      if (!nextSession) {
        navigate("/login");
        return;
      }
      setSession(nextSession);
      setUser(nextSession.user);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const s = nextSession ?? null;
      setSession(s);
      setUser(s?.user ?? null);
      if (!s) navigate("/login");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const setError = (message) => setNotice({ type: "error", message });
  const setSuccess = (message) => setNotice({ type: "success", message });

  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleUploadAvatar = async (file) => {
    if (!supabase || !user) return;
    if (!file) return;

    setNotice(null);
    setBusy(true);

    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error("Could not get avatar public URL");

      const { data: updated, error: updateError } = await supabase.auth.updateUser(
        { data: { avatar_url: publicUrl, avatar_path: path } }
      );
      if (updateError) throw updateError;

      setUser(updated.user);
      setSuccess("Profile picture updated.");
    } catch (err) {
      setError(
        err?.message ||
          "Upload failed. Make sure you created a Storage bucket named 'avatars' and allowed uploads."
      );
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    setBusy(true);
    setNotice(null);
    await supabase.auth.signOut();
    setBusy(false);
    navigate("/");
  };

  const deleteAccount = async () => {
    if (!supabase || !session) return;
    setBusy(true);
    setNotice(null);

    try {
      const res = await fetch(`${apiBaseUrl}/api/account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Delete failed (${res.status})`);
      }

      await supabase.auth.signOut();
      navigate("/");
    } catch (err) {
      setError(
        err?.message ||
          "Delete failed. Make sure your server has SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-[900px] px-4 py-16 text-slate-100 sm:px-6 lg:px-10">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
          <h1 className="text-2xl font-extrabold">Account</h1>
          <p className="mt-3 text-sm text-white/70">
            Supabase is not configured. Set `VITE_SUPABASE_URL` and
            `VITE_SUPABASE_ANON_KEY` (or `VITE_SUPABASE_PUBLISHABLE_KEY`) in
            `client/.env`, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative isolate min-h-[100dvh] overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-slate-950 via-slate-950 to-black" />

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-24 sm:px-6 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Your account
            </h1>
            <p className="mt-2 text-sm text-white/65 sm:text-base">
              Manage your profile, sign out, or delete your account.
            </p>
          </div>

          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/85 shadow-sm backdrop-blur transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 shadow-[0_30px_110px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />

            <div className="relative p-8 sm:p-10">
              <div className="flex items-center gap-5">
                <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-sm">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-white/70">
                      <User className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">
                    {user.email || user.phone || "User"}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-white/55">
                    {user.id}
                  </p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUploadAvatar(e.target.files?.[0])}
              />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={triggerFilePicker}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Camera className="h-4 w-4" aria-hidden="true" />
                  )}
                  Set profile picture
                </button>
              </div>

              <div className="mt-8 grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
                  Details
                </p>
                <div className="grid gap-3 text-sm text-white/75">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/55">Email</span>
                    <span className="truncate">{user.email || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/55">Phone</span>
                    <span className="truncate">{user.phone || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/55">Providers</span>
                    <span className="truncate">{providers.join(", ") || "—"}</span>
                  </div>
                </div>
              </div>

              {notice ? (
                <div
                  className={[
                    "mt-6 rounded-2xl border px-4 py-3 text-sm backdrop-blur",
                    notice.type === "error"
                      ? "border-red-500/25 bg-red-500/10 text-red-100"
                      : "border-emerald-500/25 bg-emerald-500/10 text-emerald-50"
                  ].join(" ")}
                >
                  {notice.message}
                </div>
              ) : null}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 shadow-[0_30px_110px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/18 via-transparent to-black/25" />

            <div className="relative p-8 sm:p-10">
              <h2 className="text-xl font-extrabold tracking-tight text-white">
                Settings
              </h2>
              <p className="mt-2 text-sm text-white/70">
                Sign out anytime. Account deletion is permanent.
              </p>

              <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
                <p className="text-sm font-semibold text-white">
                  Delete account
                </p>
                <p className="mt-2 text-sm text-white/70">
                  This permanently deletes your Supabase user. You will lose
                  access immediately.
                </p>

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const ok = window.confirm(
                      "Delete your account permanently? This cannot be undone."
                    );
                    if (ok) deleteAccount();
                  }}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Delete my account
                </button>
                <p className="mt-3 text-xs text-white/55">
                  Requires server env: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

