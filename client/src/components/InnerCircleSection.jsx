import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Apple, MapPin, Play, ShieldCheck } from "lucide-react";

import threePips from "../assets/3pips.png";

export default function InnerCircleSection() {
  const sectionRef = useRef(null);
  const entered = useInView(sectionRef, { margin: "-20% 0px -40% 0px" });

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
    hidden: { opacity: 0, y: 60 },
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

  return (
    <section id="about" ref={sectionRef} className="relative py-20 sm:py-24">
      <div className="w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate={entered ? "show" : "hidden"}
          className="relative w-full overflow-hidden border-y border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-50/95 via-white/85 to-rose-100/90" />
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_18%_20%,rgba(244,63,94,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(217,70,239,0.12),transparent_48%)]" />

          <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 py-14 sm:px-10 sm:py-16 lg:grid-cols-[0.95fr_1.1fr_0.95fr] lg:gap-16">
            <div className="text-center lg:text-left">
              <motion.h2
                variants={flyUp}
                className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
              >
                A Private Space for Your Inner Circle{" "}
                <span className="inline-flex translate-y-1 items-center justify-center text-emerald-600">
                  <ShieldCheck className="h-7 w-7" aria-hidden="true" />
                </span>
              </motion.h2>

              <motion.div
                variants={flyUp}
                className="mx-auto mt-10 grid max-w-sm gap-4 lg:mx-0"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4 text-left shadow-sm backdrop-blur transition hover:bg-white/85"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
                      <Apple className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-xs font-semibold text-slate-500">
                        Download it for
                      </span>
                      <span className="block text-lg font-bold text-slate-900">
                        iOS
                      </span>
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4 text-left shadow-sm backdrop-blur transition hover:bg-white/85"
                >
                  <span className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">
                      <Play className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-xs font-semibold text-slate-500">
                        Download it for
                      </span>
                      <span className="block text-lg font-bold text-slate-900">
                        Android
                      </span>
                    </span>
                  </span>
                </button>
              </motion.div>
            </div>

            <motion.div variants={flyUp} className="relative mx-auto w-full max-w-[520px]">
              <div className="pointer-events-none absolute -inset-14 rounded-[2.75rem] bg-gradient-to-tr from-rose-500/20 via-fuchsia-500/10 to-sky-500/15 blur-3xl opacity-90" />

              <div className="relative mx-auto aspect-[5/4] w-full">
                <div className="absolute inset-x-0 bottom-0 top-[8%] mx-auto w-[92%] overflow-hidden rounded-[2.75rem] bg-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.18)] ring-1 ring-white/30 backdrop-blur">
                  <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_30%_30%,rgba(244,63,94,0.30),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.22),transparent_60%)]" />
                  <div className="absolute inset-0 p-7">
                    <div className="grid h-full w-full grid-cols-8 gap-2 opacity-80 [mask-image:radial-gradient(circle_at_center,black_55%,transparent_80%)]">
                      {Array.from({ length: 48 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={[
                            "aspect-square rounded-xl ring-1 ring-white/25",
                            idx % 11 === 0
                              ? "bg-gradient-to-br from-fuchsia-500/35 to-sky-500/25"
                              : idx % 7 === 0
                              ? "bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.35)_0px,rgba(255,255,255,0.35)_1px,transparent_7px,transparent_14px)]"
                              : "bg-white/10"
                          ].join(" ")}
                        />
                      ))}
                    </div>
                  </div>

                  <img
                    src={threePips}
                    alt="Friends chatting together"
                    className="absolute inset-0 h-full w-full origin-center scale-[1.18] translate-y-[30%] object-cover object-center drop-shadow-[0_30px_70px_rgba(0,0,0,0.25)]"
                  />
                </div>
              </div>
            </motion.div>

            <div className="relative mx-auto w-full max-w-md text-center lg:mx-0 lg:text-left">
              <motion.p
                variants={flyUp}
                className="text-pretty text-sm leading-6 text-slate-600 sm:text-base"
              >
                Private messaging that feels instant and dependable. Share
                photos, files, and voice notes with zero lag - protected by
                end-to-end encryption.
              </motion.p>

              <motion.div
                variants={flyUp}
                className="mx-auto mt-10 w-full max-w-[22rem] overflow-hidden rounded-3xl border border-slate-200/70 bg-white/75 p-6 text-left shadow-[0_22px_70px_rgba(0,0,0,0.14)] backdrop-blur lg:mx-0"
              >
                <p className="text-base font-semibold text-slate-900">
                  kumain ka na ga?
                </p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-tr from-fuchsia-500/40 to-sky-500/35 ring-1 ring-slate-200/70">
                    <span className="text-sm font-extrabold text-slate-900/80">
                      BS
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      Bella Sangwan
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      Batangas • 17km away
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
