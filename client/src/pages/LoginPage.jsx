import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Users,
  Video
} from "lucide-react";

import bg1 from "../assets/bg1.jpg";
import appIcon from "../assets/icon.png";
import blackImg from "../assets/black.png";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient.js";

const EASE = [0.22, 1, 0.36, 1];

export default function LoginPage() {
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState("signin"); // signin | signup
  const [method, setMethod] = useState("email"); // email | phone

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [supabaseHealth, setSupabaseHealth] = useState({ status: "idle", message: "" });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const supabaseHost = useMemo(() => {
    if (!supabaseUrl) return "";
    try {
      return new URL(supabaseUrl).host;
    } catch {
      return supabaseUrl;
    }
  }, [supabaseUrl]);

  const title = authMode === "signin" ? "Welcome back" : "Create your account";
  const subtitle = useMemo(() => {
    if (authMode === "signin") {
      return "Sign in to pick up where you left off—your chats stay private, fast, and synced across devices.";
    }
    return "Create an account to start chatting. You can use email + password, phone OTP, or Google.";
  }, [authMode]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!supabase) return;

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) navigate("/chat");
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/chat");
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured, navigate]);

  useEffect(() => {
    if (!supabaseUrl || !supabaseKey) return;

    const controller = new AbortController();
    setSupabaseHealth({ status: "checking", message: "Checking Supabase connectivity…" });

    fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseKey },
      signal: controller.signal
    })
      .then(async (res) => {
        if (res.ok) {
          setSupabaseHealth({ status: "ok", message: "Supabase reachable" });
          return;
        }

        const text = await res.text().catch(() => "");
        setSupabaseHealth({
          status: "error",
          message: `Supabase error (status ${res.status})${text ? `: ${text}` : ""}`
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setSupabaseHealth({
          status: "error",
          message: err?.message || "Could not reach Supabase"
        });
      });

    return () => controller.abort();
  }, [supabaseKey, supabaseUrl]);

  const resetNotices = () => setNotice(null);

  const formatAuthError = (err) => {
    if (!err) return null;
    const parts = [];
    if (err.message) parts.push(String(err.message));
    if (err.status) parts.push(`(status ${err.status})`);
    if (err.code) parts.push(`[${err.code}]`);
    return parts.join(" ");
  };

  const setThrownError = (err, fallback) => {
    const message =
      err?.message ||
      (typeof err === "string" ? err : null) ||
      fallback ||
      "Something went wrong. Please try again.";
    setNotice({ type: "error", message });
  };

  const ensureConfigured = () => {
    if (isSupabaseConfigured) return true;
    setNotice({
      type: "error",
      message:
        "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in client/.env."
    });
    return false;
  };

  const handleGoogle = async () => {
    resetNotices();
    if (!ensureConfigured()) return;
    if (!supabase) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) setNotice({ type: "error", message: formatAuthError(error) });
    } catch (err) {
      setThrownError(err, "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    resetNotices();
    if (!ensureConfigured()) return;
    if (!supabase) return;

    if (!email || !password) {
      setNotice({ type: "error", message: "Please enter email and password." });
      return;
    }

    setLoading(true);
    try {
      if (authMode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          setNotice({ type: "error", message: formatAuthError(error) });
          return;
        }
        if (data?.session) navigate("/chat");
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setNotice({ type: "error", message: formatAuthError(error) });
        return;
      }

      if (data?.session) {
        navigate("/chat");
        return;
      }

      if (!data.session) {
        setNotice({
          type: "success",
          message: "Check your email to confirm your account, then sign in."
        });
      }
    } catch (err) {
      setThrownError(err, "Email authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    resetNotices();
    if (!ensureConfigured()) return;
    if (!supabase) return;

    if (!phone) {
      setNotice({
        type: "error",
        message: "Enter your phone number (example: +63XXXXXXXXXX)."
      });
      return;
    }

    setLoading(true);
    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) {
          setNotice({ type: "error", message: formatAuthError(error) });
          return;
        }
        setOtpSent(true);
        setNotice({
          type: "success",
          message: "We sent you a code. Enter it to continue."
        });
        return;
      }

      if (!otp) {
        setNotice({ type: "error", message: "Enter the SMS code." });
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms"
      });
      if (error) {
        setNotice({ type: "error", message: formatAuthError(error) });
        return;
      }

      navigate("/chat");
    } catch (err) {
      setThrownError(err, "Phone sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate min-h-[100dvh] overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <img
          alt=""
          src={bg1}
          className="h-full w-full scale-[1.03] object-cover object-center opacity-90 saturate-125"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/80" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] flex-col px-4 pb-16 pt-28 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>

          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-tr from-pink-500/30 to-fuchsia-500/20 ring-1 ring-white/10">
              <img
                src={appIcon}
                alt="App icon"
                className="h-7 w-7 rounded-full object-cover"
              />
            </div>
            <div className="text-sm font-semibold text-white/85">My Chat App</div>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:items-stretch">
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 shadow-[0_30px_110px_rgba(0,0,0,0.6)] backdrop-blur"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
            <div className="relative px-7 py-10 sm:px-10 sm:py-12">
              <h1 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-md text-pretty text-sm leading-6 text-white/65 sm:text-base">
                {subtitle}
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 48 48"
                      className="h-4 w-4"
                      focusable="false"
                    >
                      <path
                        fill="#FFC107"
                        d="M43.611 20.083H42V20H24v8h11.303C33.655 32.653 29.151 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.381 4.332-17.694 10.691z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.132 0-9.621-3.327-11.283-7.946l-6.52 5.025C9.473 39.556 16.227 44 24 44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.611 20.083H42V20H24v8h11.303a12.03 12.03 0 0 1-4.087 5.565l6.19 5.238C40.913 36.187 44 30.659 44 24c0-1.341-.138-2.65-.389-3.917z"
                      />
                    </svg>
                  </span>
                  Continue with Google
                </button>

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-semibold text-white/45">or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="flex w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-sm font-semibold text-white/75 shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() => {
                      resetNotices();
                      setMethod("email");
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className={[
                      "flex-1 px-4 py-2.5 transition",
                      method === "email"
                        ? "bg-white/10 text-white"
                        : "hover:bg-white/10"
                    ].join(" ")}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetNotices();
                      setMethod("phone");
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className={[
                      "flex-1 px-4 py-2.5 transition",
                      method === "phone"
                        ? "bg-white/10 text-white"
                        : "hover:bg-white/10"
                    ].join(" ")}
                  >
                    Phone
                  </button>
                </div>

                {notice ? (
                  <div
                    className={[
                      "mt-5 rounded-2xl border px-4 py-3 text-sm backdrop-blur",
                      notice.type === "error"
                        ? "border-red-500/25 bg-red-500/10 text-red-100"
                        : "border-emerald-500/25 bg-emerald-500/10 text-emerald-50"
                    ].join(" ")}
                  >
                    {notice.message}
                  </div>
                ) : null}

                {isSupabaseConfigured && supabaseHost ? (
                  <p className="mt-4 text-xs font-semibold text-white/45">
                    Supabase: {supabaseHost} ·{" "}
                    <span
                      className={
                        supabaseHealth.status === "ok"
                          ? "text-emerald-200/80"
                          : supabaseHealth.status === "checking"
                          ? "text-white/55"
                          : "text-red-200/80"
                      }
                    >
                      {supabaseHealth.message || "—"}
                    </span>
                  </p>
                ) : null}

                {method === "email" ? (
                  <form className="mt-6 space-y-5" onSubmit={handleEmailAuth}>
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70">
                        Email
                      </span>
                      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                        <Mail className="h-4 w-4 text-white/55" aria-hidden="true" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                          placeholder="you@example.com"
                          autoComplete="email"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-semibold text-white/70">
                        Password
                      </span>
                      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                        <Lock className="h-4 w-4 text-white/55" aria-hidden="true" />
                        <input
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          type="password"
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                          placeholder="••••••••"
                          autoComplete={
                            authMode === "signin"
                              ? "current-password"
                              : "new-password"
                          }
                        />
                      </div>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-pink-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-pink-500/25 transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading
                        ? "Please wait…"
                        : authMode === "signin"
                        ? "Sign in"
                        : "Create account"}
                    </button>
                  </form>
                ) : (
                  <form className="mt-6 space-y-5" onSubmit={handlePhoneAuth}>
                    <label className="block">
                      <span className="text-xs font-semibold text-white/70">
                        Phone number
                      </span>
                      <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                        <Phone className="h-4 w-4 text-white/55" aria-hidden="true" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                          placeholder="+63XXXXXXXXXX"
                          autoComplete="tel"
                          inputMode="tel"
                        />
                      </div>
                    </label>

                    {otpSent ? (
                      <label className="block">
                        <span className="text-xs font-semibold text-white/70">
                          SMS code
                        </span>
                        <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                          <KeyRound className="h-4 w-4 text-white/55" aria-hidden="true" />
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                            placeholder="123456"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              resetNotices();
                              setOtpSent(false);
                              setOtp("");
                            }}
                            className="text-xs font-semibold text-white/55 transition hover:text-white/80"
                          >
                            Change
                          </button>
                        </div>
                      </label>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-pink-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-pink-500/25 transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loading ? "Please wait…" : otpSent ? "Verify code" : "Send code"}
                    </button>
                  </form>
                )}

                <p className="mt-6 text-center text-xs text-white/55">
                  {authMode === "signin"
                    ? "No account yet? "
                    : "Already have an account? "}
                  <button
                    type="button"
                    className="font-semibold text-white/75 underline-offset-2 hover:underline"
                    onClick={() => {
                      resetNotices();
                      setAuthMode((m) => (m === "signin" ? "signup" : "signin"));
                      setOtpSent(false);
                      setOtp("");
                    }}
                  >
                    {authMode === "signin" ? "Create one" : "Sign in"}
                  </button>
                </p>
              </div>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: EASE, delay: 0.05 }}
            className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 shadow-[0_30px_110px_rgba(0,0,0,0.6)] backdrop-blur"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/20 via-fuchsia-500/12 to-slate-950/30" />
            <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.18),transparent_48%),radial-gradient(circle_at_80%_30%,rgba(255,255,255,0.10),transparent_55%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.14)_0px,rgba(255,255,255,0.14)_1px,transparent_12px,transparent_18px)]" />

            <div className="relative flex h-full flex-col px-7 py-10 sm:px-10 sm:py-12">
              <div className="relative mx-auto mt-2 w-full max-w-[620px] flex-1">
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 shadow-[0_28px_95px_rgba(0,0,0,0.55)] backdrop-blur" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/5" />

                <div className="absolute left-1/2 top-1/2 h-[68%] w-[68%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
                  <img
                    src={blackImg}
                    alt=""
                    className="absolute inset-0 h-full w-full scale-[1.08] object-cover object-top"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/10" />
                </div>

                {[
                  {
                    title: "End-to-end encrypted",
                    value: "Private by default",
                    Icon: ShieldCheck,
                    className: "left-[4%] top-[2%]"
                  },
                  {
                    title: "Group chats",
                    value: "Built for teams",
                    Icon: Users,
                    className: "right-[4%] top-[3%]"
                  },
                  {
                    title: "Crystal-clear calls",
                    value: "Video & voice",
                    Icon: Video,
                    className: "left-[6%] bottom-[14%]"
                  }
                ].map(({ title: cardTitle, value, Icon, className }) => (
                  <div
                    key={cardTitle}
                    className={[
                      "absolute hidden w-[min(16.5rem,44%)] overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur-lg sm:block",
                      className
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <div className="grid h-10 w-10 flex-none place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                        <Icon className="h-5 w-5 text-white/85" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white/70">{cardTitle}</p>
                        <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 text-center">
                <h2 className="text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Secure chat, instantly.
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-6 text-white/65 sm:text-base">
                  Send messages, photos, and files with zero lag - only the people
                  you choose can read them.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
