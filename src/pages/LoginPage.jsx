import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
  Video
} from "lucide-react";

import bg1 from "../assets/bg1.jpg";
import appIcon from "../assets/icon.png";
import blackImg from "../assets/black.png";

const EASE = [0.22, 1, 0.36, 1];

export default function LoginPage() {
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
                Welcome back
              </h1>
              <p className="mt-3 max-w-md text-pretty text-sm leading-6 text-white/65 sm:text-base">
                Sign in to pick up where you left off—your chats stay private,
                fast, and synced across devices.
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-sm backdrop-blur transition hover:bg-white/15"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                    <Sparkles className="h-4 w-4 text-white/85" aria-hidden="true" />
                  </span>
                  Continue with Google
                </button>

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs font-semibold text-white/45">or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <form className="space-y-5">
                  <label className="block">
                    <span className="text-xs font-semibold text-white/70">
                      Email or phone
                    </span>
                    <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                      <Mail className="h-4 w-4 text-white/55" aria-hidden="true" />
                      <input
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
                        type="password"
                        className="w-full bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="text-xs font-semibold text-white/55 transition hover:text-white/80"
                      >
                        Forgot?
                      </button>
                    </div>
                  </label>

                  <button
                    type="button"
                    className="w-full rounded-2xl bg-pink-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-pink-500/25 transition hover:bg-pink-400"
                  >
                    Sign in
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-white/55">
                  No account yet?{" "}
                  <button
                    type="button"
                    className="font-semibold text-white/75 underline-offset-2 hover:underline"
                  >
                    Create one
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
                ].map(({ title, value, Icon, className }) => (
                  <div
                    key={title}
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
                        <p className="text-xs font-semibold text-white/70">{title}</p>
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
