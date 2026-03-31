import { motion, useInView } from "motion/react";
import { useRef } from "react";

import blackImg from "../assets/black.png";

export default function ReviewsSection() {
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

  return (
    <section id="reviews" ref={sectionRef} className="relative pb-24 pt-6 sm:pb-28 sm:pt-10">
      <div className="w-full">
        <motion.div
          variants={container}
          initial="hidden"
          animate={entered ? "show" : "hidden"}
          className="relative w-full overflow-hidden border-y border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950/85 via-slate-950/70 to-slate-900/80" />
          <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.10),transparent_45%),radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.06),transparent_48%)]" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-80">
            <div className="absolute -bottom-10 left-[-6%] h-44 w-[38rem] rounded-[100%] bg-slate-900/70 blur-[1px]" />
            <div className="absolute -bottom-12 left-[22%] h-52 w-[44rem] rounded-[100%] bg-slate-900/70 blur-[1px]" />
            <div className="absolute -bottom-14 right-[-8%] h-48 w-[42rem] rounded-[100%] bg-slate-900/70 blur-[1px]" />
          </div>

          <div className="relative mx-auto w-full max-w-[1400px] px-6 py-14 sm:px-10 sm:py-16">
            <motion.header variants={flyUp} className="text-center">
              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Reviews From Users
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm leading-6 text-white/65 sm:text-base">
                Real feedback from people who rely on fast, private messaging
                every day.
              </p>
            </motion.header>

            <div className="mt-12 grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr_0.65fr] lg:gap-14">
              <motion.div
                variants={flyUp}
                className="relative mx-auto w-full max-w-[460px]"
              >
                
                <div className="relative h-[520px] w-full overflow-hidden rounded-[2.75rem] sm:h-[600px]">
                  <img
                    src={blackImg}
                    alt=""
                    className="block w-full h-[520px] sm:h-[600px] object-cover rounded-[2.75rem] overflow-hidden"
                   
                  />
                </div>
              </motion.div>

              <motion.div variants={flyUp} className="relative mx-auto w-full max-w-[720px]">
                <div className="pointer-events-none absolute -left-8 -top-10 text-[140px] font-extrabold leading-none text-white/10">
                  "
                </div>
                <div className="relative rounded-[2.25rem] border border-white/10 bg-white/5 p-8 shadow-sm backdrop-blur">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        JC Santos
                      </p>
                      <p className="mt-1 text-xs font-semibold text-white/55">
                        Philippines
                      </p>
                    </div>
                  </div>

                  <p className="mt-5 text-pretty text-sm leading-7 text-white/70 sm:text-base">
                    The app feels instant - even in busy group chats. Uploading
                    photos is quick, calls are clear, and everything stays
                    private.
                  </p>
                </div>
              </motion.div>

              <motion.aside
                variants={flyUp}
                className="mx-auto w-full max-w-[360px] space-y-8 text-center lg:text-left"
              >
                {[
                  { value: "15k+", label: "Daily messages" },
                  { value: "1458", label: "New members each day" },
                  { value: "30k+", label: "Communities worldwide" }
                ].map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 px-7 py-6 backdrop-blur">
                    <div className="text-4xl font-extrabold tracking-tight text-white">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white/55">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.aside>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
