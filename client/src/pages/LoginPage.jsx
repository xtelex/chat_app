import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, Lock, Mail, Phone } from "lucide-react";
import appIcon from "../assets/icon.png";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient.js";

export default function LoginPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState("signin");
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState(null);

  // Auto-redirect if already logged in (stay logged in)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setChecking(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) { navigate("/chat", { replace: true }); }
      else { setChecking(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate("/chat", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fmt = (err) => err?.message || String(err) || "Something went wrong.";

  const handleGoogle = async () => {
    const ua = navigator.userAgent || "";
    const isInApp = /FBAN|FBAV|Instagram|Twitter|Line|WhatsApp|Snapchat/i.test(ua)
      || (ua.includes("iPhone") && !ua.includes("Safari"));
    if (isInApp) { setNotice({ type: "error", message: "Open in Safari or Chrome to sign in with Google." }); return; }
    if (!supabase) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin }
      });
      if (error) setNotice({ type: "error", message: fmt(error) });
    } catch (err) { setNotice({ type: "error", message: fmt(err) }); }
    finally { setLoading(false); }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!email || !password) { setNotice({ type: "error", message: "Please enter email and password." }); return; }
    if (!supabase) return;
    setLoading(true);
    try {
      if (authMode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setNotice({ type: "error", message: fmt(error) }); return; }
        if (data?.session) navigate("/chat", { replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) { setNotice({ type: "error", message: fmt(error) }); return; }
        if (data?.session) { navigate("/chat", { replace: true }); return; }
        setNotice({ type: "success", message: "Check your email to confirm your account, then sign in." });
      }
    } catch (err) { setNotice({ type: "error", message: fmt(err) }); }
    finally { setLoading(false); }
  };

  const handlePhoneAuth = async (e) => {
    e.preventDefault();
    setNotice(null);
    if (!phone) { setNotice({ type: "error", message: "Enter your phone number (e.g. +63XXXXXXXXXX)." }); return; }
    if (!supabase) return;
    setLoading(true);
    try {
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) { setNotice({ type: "error", message: fmt(error) }); return; }
        setOtpSent(true);
        setNotice({ type: "success", message: "SMS code sent. Enter it below." });
      } else {
        if (!otp) { setNotice({ type: "error", message: "Enter the SMS code." }); return; }
        const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
        if (error) { setNotice({ type: "error", message: fmt(error) }); return; }
        navigate("/chat", { replace: true });
      }
    } catch (err) { setNotice({ type: "error", message: fmt(err) }); }
    finally { setLoading(false); }
  };

  // Show nothing while checking session (prevents flash of login page)
  if (checking) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center px-4 py-8">
      {/* Card — centered on all screen sizes */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 px-8 py-10">

        {/* Logo + title */}
        <div className="flex flex-col items-center mb-8">
          <img src={appIcon} alt="App icon" className="h-16 w-16 rounded-2xl shadow-md mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Chat App</h1>
          <p className="text-sm text-gray-500 mt-1">
            {authMode === "signin" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {/* Auth mode toggle */}
        <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
          {["signin", "signup"].map((mode) => (
            <button key={mode} type="button"
              onClick={() => { setAuthMode(mode); setNotice(null); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${authMode === mode ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Method toggle */}
        <div className="flex gap-2 mb-6">
          {["email", "phone"].map((m) => (
            <button key={m} type="button"
              onClick={() => { setMethod(m); setNotice(null); setOtpSent(false); setOtp(""); }}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition ${method === m ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
              {m === "email" ? "Email" : "Phone"}
            </button>
          ))}
        </div>

        {/* Notice */}
        {notice && (
          <div className={`mb-5 rounded-xl px-4 py-3 text-sm ${notice.type === "error" ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
            {notice.message}
          </div>
        )}

        {/* Email form */}
        {method === "email" ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="••••••••" autoComplete={authMode === "signin" ? "current-password" : "new-password"} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-2">
              {loading ? "Please wait…" : authMode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePhoneAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                  placeholder="+63XXXXXXXXXX" autoComplete="tel" inputMode="tel" />
              </div>
            </div>
            {otpSent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">SMS Code</label>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition">
                  <KeyRound className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
                    placeholder="123456" inputMode="numeric" autoComplete="one-time-code" />
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setNotice(null); }}
                    className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition flex-shrink-0">Change</button>
                </div>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-3 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mt-2">
              {loading ? "Please wait…" : otpSent ? "Verify Code" : "Send Code"}
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400 font-medium">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google */}
        <button type="button" onClick={handleGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 py-3 text-sm font-semibold text-gray-700 transition shadow-sm disabled:opacity-60">
          <svg viewBox="0 0 48 48" className="h-5 w-5 flex-shrink-0" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.655 32.653 29.151 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.047 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.001 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.047 6.053 29.268 4 24 4c-7.682 0-14.381 4.332-17.694 10.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.197l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.132 0-9.621-3.327-11.283-7.946l-6.52 5.025C9.473 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.03 12.03 0 0 1-4.087 5.565l6.19 5.238C40.913 36.187 44 30.659 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Sign in with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          {authMode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => { setAuthMode((m) => m === "signin" ? "signup" : "signin"); setNotice(null); }}
            className="text-blue-500 font-semibold hover:text-blue-700 transition">
            {authMode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
