import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import {
  Files,
  Image,
  Mail,
  Mic,
  Play,
  Video
} from "lucide-react";

import mock1 from "../assets/mock1.png";
import mock2 from "../assets/mock2.png";

export default function IntegrationsSection() {
  const sectionRef = useRef(null);
  const entered = useInView(sectionRef, { margin: "-20% 0px -40% 0px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const phoneLeftY = useTransform(scrollYProgress, [0, 1], [16, -18]);
  const phoneRightY = useTransform(scrollYProgress, [0, 1], [22, -14]);
  const cardFloatY = useTransform(scrollYProgress, [0, 1], [10, -10]);

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05
      }
    }
  };

  const flyUp = {
    hidden: { opacity: 0, y: 70 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 140,
        damping: 18,
        mass: 0.9
      }
    }
  };

  const notifications = {
    Images: 3,
    Files: 1
  };

  const quickActions = [
    { label: "Files", Icon: Files, count: notifications.Files },
    { label: "Images", Icon: Image, count: notifications.Images },
    { label: "Voice", Icon: Mic },
    { label: "Email", Icon: Mail },
    { label: "Video", Icon: Video }
  ];

  return (
    <section id="security" ref={sectionRef} className="relative pb-24 pt-6 sm:pb-28 sm:pt-10">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <motion.header
          variants={container}
          initial="hidden"
          animate={entered ? "show" : "hidden"}
          className="text-center"
        >
          <motion.h2
            variants={flyUp}
            className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Secure Conversations, End-to-End Encryption
          </motion.h2>
          <motion.p
            variants={flyUp}
            className="mx-auto mt-4 max-w-3xl text-pretty text-sm leading-6 text-white/70 sm:text-base"
          >
            Experience lightning-fast messaging with zero lag. Whether you're
            sending high-res photos or starting a crystal-clear video call, we
            keep you connected safely.
          </motion.p>
        </motion.header>

        <motion.div
          variants={container}
          initial="hidden"
          animate={entered ? "show" : "hidden"}
          className="relative mt-12"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-16 -z-10 blur-3xl"
          >
            <div className="absolute left-[8%] top-[18%] h-52 w-80 rounded-full bg-sky-400/10" />
            <div className="absolute right-[10%] top-[24%] h-56 w-96 rounded-full bg-fuchsia-500/10" />
            <div className="absolute bottom-[10%] left-1/2 h-56 w-[34rem] -translate-x-1/2 rounded-full bg-red-500/10" />
          </motion.div>

          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
            <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_40%),radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.14),transparent_45%)]" />

            <div className="relative px-6 py-16 sm:px-10 sm:py-20">
              <div className="relative mx-auto h-[360px] sm:h-[420px] lg:h-[460px]">
                <motion.div
                  variants={flyUp}
                  className="absolute left-0 top-10 w-[min(340px,52vw)] origin-bottom-left rotate-[-12deg] sm:left-6 sm:top-8 lg:left-12"
                  style={{ y: phoneLeftY }}
                >
                  <img
                    src={mock1}
                    alt="Chat app preview"
                    className="w-full rounded-[2rem] shadow-[0_40px_110px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
                  />

                  <div className="pointer-events-none absolute left-[18%] top-[18%] h-[62%] w-[64%] overflow-hidden rounded-[1.35rem] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
                    <div className="h-full bg-gradient-to-b from-slate-50 to-slate-100">
                      <div className="flex items-center justify-between px-4 pt-3 text-[11px] font-semibold text-slate-700">
                        <span>9:41</span>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                        </div>
                      </div>

                      <div className="mt-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-pink-500 to-fuchsia-500" />
                          <div className="text-xs font-semibold text-slate-800">
                            Mia
                          </div>
                          <div className="ml-auto text-[11px] text-slate-500">
                            Active
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 px-4">
                        <div className="max-w-[78%] rounded-2xl bg-white px-3 py-2 text-[11px] leading-4 text-slate-700 shadow-sm ring-1 ring-black/5">
                          Balita?
                        </div>
                        <div className="ml-auto max-w-[78%] rounded-2xl bg-blue-500 px-3 py-2 text-[11px] leading-4 text-white shadow-sm">
                          oks lang buhay pa naman.
                        </div>
                        <div className="max-w-[78%] rounded-2xl bg-white px-3 py-2 text-[11px] leading-4 text-slate-700 shadow-sm ring-1 ring-black/5">
                          aray mooo HAHAHAH
                        </div>
                        <div className="ml-auto max-w-[78%] rounded-2xl bg-blue-500 px-3 py-2 text-[11px] leading-4 text-white shadow-sm">
                          TARANTADOOO!!
                        </div>
                      </div>

                      <div className="mt-3 px-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[11px] text-slate-600 shadow-sm ring-1 ring-black/5">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                          typing…
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 px-4 pb-3">
                        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
                          <div className="h-7 w-7 rounded-full bg-slate-100 ring-1 ring-black/5" />
                          <div className="text-[11px] text-slate-500">
                            Message…
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            <div className="h-7 w-7 rounded-full bg-yellow-100 ring-1 ring-black/5" />
                            <div className="h-7 w-7 rounded-full bg-blue-100 ring-1 ring-black/5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={flyUp}
                  className="absolute right-0 top-14 w-[min(340px,52vw)] origin-bottom-right rotate-[14deg] sm:right-6 sm:top-10 lg:right-10"
                  style={{ y: phoneRightY }}
                >
                  <img
                    src={mock2}
                    alt="Video calling preview"
                    className="w-full rounded-[2rem] shadow-[0_40px_110px_rgba(0,0,0,0.65)] ring-1 ring-white/10"
                  />

                  <div className="pointer-events-none absolute left-[18%] top-[18%] h-[62%] w-[64%] overflow-hidden rounded-[1.35rem] bg-white shadow-[0_24px_90px_rgba(0,0,0,0.35)] ring-1 ring-black/10">
                    <div className="relative h-full overflow-hidden bg-gradient-to-br from-indigo-600 via-slate-950 to-slate-950">
                      <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.10),transparent_60%)]" />
                      <div className="relative flex h-full flex-col px-4 py-3 text-white">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-white/85">
                          <span>9:41</span>
                          <div className="flex items-center gap-1.5 text-white/70">
                            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                          </div>
                        </div>

                        <div className="mt-3 grid flex-1 place-items-center">
                          <div className="relative h-20 w-20 overflow-hidden rounded-full bg-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.45)] ring-1 ring-white/15">
                            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/60 to-sky-500/60 blur-xl opacity-70" />
                            <div className="relative grid h-full w-full place-items-center">
                              <div className="h-12 w-12 rounded-full bg-white/20 ring-1 ring-white/25" />
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 text-[11px] text-white/75">
                          {[
                            {
                              label: "Images",
                              Icon: Image,
                              color: "from-sky-500/80 to-indigo-500/70"
                            },
                            {
                              label: "Voice",
                              Icon: Mic,
                              color: "from-emerald-400/80 to-sky-500/70"
                            },
                            {
                              label: "Video",
                              Icon: Video,
                              color: "from-fuchsia-500/80 to-rose-500/70"
                            },
                            {
                              label: "Files",
                              Icon: Files,
                              color: "from-amber-400/80 to-yellow-500/70"
                            },
                            {
                              label: "Email",
                              Icon: Mail,
                              color: "from-violet-500/80 to-fuchsia-500/60"
                            }
                          ].map(({ label, Icon, color }) => (
                            <div
                              key={label}
                              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur"
                            >
                              <span
                                className={[
                                  "grid h-7 w-7 place-items-center rounded-lg text-white shadow-sm ring-1 ring-white/10",
                                  `bg-gradient-to-tr ${color}`
                                ].join(" ")}
                              >
                                <Icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <span className="font-semibold text-white/85">
                                {label}
                              </span>
                              <span className="ml-auto text-white/55">
                                {notifications[label]
                                  ? `${notifications[label]} new`
                                  : "Ready"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={flyUp}
                  style={{ y: cardFloatY }}
                  className="absolute left-1/2 top-[45%] hidden -translate-x-1/2 -translate-y-1/2 sm:block"
                >
                  <div className="relative flex w-[268px] flex-wrap justify-center gap-3 overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-4 shadow-[0_28px_75px_rgba(0,0,0,0.65)] backdrop-blur-lg">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
                    {quickActions.map(({ label, Icon, count }) => (
                      <div key={label} className="relative">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-slate-950/35 text-white/85 shadow-sm backdrop-blur">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                          {count ? (
                            <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow ring-2 ring-slate-950/40">
                              {count}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-center text-[11px] font-semibold leading-none text-white/60">
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div
                  variants={flyUp}
                  style={{ y: cardFloatY }}
                  className="absolute left-[6%] top-6 hidden w-[min(22rem,48%)] overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-sky-500/20 via-white/10 to-fuchsia-500/15 px-5 py-4 text-left shadow-lg backdrop-blur-lg sm:block"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-12 h-28 w-56 rotate-12 bg-gradient-to-r from-fuchsia-500/55 via-violet-500/35 to-transparent blur-2xl opacity-70"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-10 top-10 h-24 w-48 -rotate-12 bg-gradient-to-r from-sky-400/35 via-indigo-500/25 to-transparent blur-2xl opacity-60"
                  />
                  <div className="relative flex items-center gap-4">
                    <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-emerald-400/70 to-sky-500/70 text-white shadow-md shadow-emerald-500/20 ring-1 ring-white/15">
                      <Play className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Voice Note</p>
                      <p className="mt-0.5 text-xs text-white/70">
                        Shared Audio • 0:45 Duration
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {[10, 16, 12, 22, 14, 18, 10, 20, 12, 16, 10].map((h, idx) => (
                          <span
                            key={idx}
                            className="w-1 rounded-full bg-white/70"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                        <span className="ml-2 text-[11px] font-semibold text-white/80">
                          0:45
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={flyUp}
                  style={{ y: cardFloatY }}
                  className="absolute right-[6%] top-10 hidden w-[min(22rem,48%)] overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-fuchsia-500/12 via-white/8 to-sky-500/10 px-5 py-4 text-left shadow-lg backdrop-blur-lg sm:block"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -left-12 -top-12 h-28 w-56 rotate-12 bg-gradient-to-r from-fuchsia-500/35 via-sky-500/20 to-transparent blur-2xl opacity-70"
                  />
                  <div className="relative flex items-center gap-4">
                    <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-fuchsia-500/55 to-sky-500/45 text-sm font-bold text-white shadow-md shadow-fuchsia-500/20 ring-1 ring-white/15">
                      <span className="text-sm font-extrabold">+</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Shared Gallery</p>
                      <p className="mt-0.5 text-xs text-white/60">
                        Sent 12 items today.
                      </p>
                      <div className="mt-2 grid grid-cols-3 gap-1.5">
                        {[
                          "bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.45),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(217,70,239,0.35),transparent_60%)]",
                          "bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.14)_0px,rgba(255,255,255,0.14)_1px,transparent_8px,transparent_16px)]",
                          "bg-gradient-to-br from-amber-400/35 via-white/5 to-rose-500/25"
                        ].map((pattern, idx) => (
                          <div
                            key={idx}
                            aria-hidden="true"
                            className={[
                              "h-10 w-10 overflow-hidden rounded-lg bg-white/10 ring-1 ring-white/10",
                              pattern
                            ].join(" ")}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  variants={flyUp}
                  style={{ y: cardFloatY }}
                  className="absolute bottom-6 left-1/2 w-[min(26rem,92%)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-r from-rose-500/12 via-white/10 to-slate-950/10 px-5 py-4 text-left shadow-lg backdrop-blur-lg"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-10 -top-14 h-28 w-64 rotate-12 bg-gradient-to-r from-rose-500/35 via-fuchsia-500/20 to-transparent blur-2xl opacity-70"
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-tr from-rose-500/70 to-fuchsia-500/70 text-white shadow-md shadow-rose-500/20 ring-1 ring-white/15">
                        <Files className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Shared Files
                        </p>
                        <p className="mt-0.5 text-xs text-white/70">
                          Send docs and voice notes instantly.
                        </p>
                      </div>
                    </div>
                    <div className="hidden w-40 overflow-hidden rounded-xl border border-white/10 bg-white/10 p-2 shadow-sm backdrop-blur sm:block">
                      <div className="relative h-12 overflow-hidden rounded-lg bg-slate-950/25">
                        <div className="absolute inset-0 opacity-70 [background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.10)_0px,rgba(255,255,255,0.10)_1px,transparent_10px,transparent_14px),repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_1px,transparent_12px,transparent_18px)]" />
                        <div className="relative flex h-full flex-col justify-center gap-1 px-2 text-[10px] font-semibold">
                          <div className="flex items-center gap-2 text-white/80">
                            <span className="h-2 w-2 rounded-sm bg-amber-400/90" />
                            <span className="truncate">pitch-deck.pdf</span>
                            <span className="ml-auto text-white/55">2.1MB</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/75">
                            <span className="h-2 w-2 rounded-sm bg-sky-400/90" />
                            <span className="truncate">design.png</span>
                            <span className="ml-auto text-white/55">4.8MB</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-1 text-[11px] font-semibold text-white/80">
                        2 Attachments
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
