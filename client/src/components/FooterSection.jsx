import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Facebook, Github, Linkedin, Sparkles } from "lucide-react";

import appIcon from "../assets/icon.png";

export default function FooterSection() {
  const footerRef = useRef(null);
  const entered = useInView(footerRef, { margin: "-15% 0px -25% 0px" });

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
    hidden: { opacity: 0, y: 26 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 170, damping: 22, mass: 0.9 }
    }
  };

  return (
    <footer ref={footerRef} className="relative pb-10 pt-14 sm:pb-12 sm:pt-18">
      <div id="faq" className="sr-only" />

      <div className="w-full">
        <motion.section
          variants={container}
          initial="hidden"
          animate={entered ? "show" : "hidden"}
          className="relative w-full overflow-hidden border-y border-white/10 bg-white/5 shadow-[0_35px_110px_rgba(0,0,0,0.65)] backdrop-blur"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(136,19,55,0.55),transparent_68%)] blur-3xl opacity-70" />
          <div className="pointer-events-none absolute -bottom-28 -left-28 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.42),transparent_65%)] blur-3xl opacity-60" />

          <div className="relative mx-auto w-full max-w-[1400px]">
          <div className="relative px-6 py-12 sm:px-10 sm:py-14">
            <motion.div
              variants={flyUp}
              className="flex flex-col items-center justify-between gap-8 rounded-[2.25rem] border border-white/10 bg-white/5 p-8 text-center shadow-sm backdrop-blur lg:flex-row lg:text-left"
            >
              <div>
                <p className="text-balance text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Ready to start the conversation?
                </p>
                <p className="mt-2 max-w-xl text-pretty text-sm leading-6 text-white/65 sm:text-base">
                  Join the beta and chat with your inner circle—private, fast,
                  and synced everywhere.
                </p>
              </div>

              <motion.div variants={flyUp} className="flex items-center gap-4">
                <Link to="/login" className="inline-flex">
                  <motion.span
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                    className="relative inline-flex items-center gap-3 rounded-full bg-gradient-to-b from-pink-400 to-pink-600 px-7 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(236,72,153,0.35),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/15 transition hover:from-pink-300 hover:to-pink-500"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-white/25 ring-1 ring-white/20">
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    </span>
                    Join the Beta
                  </motion.span>
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={container}
              className="mt-12 grid gap-10 lg:grid-cols-3"
            >
              <motion.div variants={flyUp} className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-tr from-pink-500/30 to-fuchsia-500/20 ring-1 ring-white/10">
                    <img
                      src={appIcon}
                      alt="App icon"
                      className="h-8 w-8 rounded-xl object-cover"
                    />
                  </div>
                  <div className="text-sm font-semibold text-white/85">
                    My Chat App
                  </div>
                </div>

                <p className="mt-4 text-pretty text-sm leading-6 text-white/65">
                  Bringing People Closer, One Message at a Time.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  {[
                    { Icon: Github, label: "GitHub", href: "#" },
                    { Icon: Linkedin, label: "LinkedIn", href: "#" },
                    { Icon: Facebook, label: "Facebook", href: "#" }
                  ].map(({ Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/75 shadow-sm backdrop-blur transition hover:bg-white/10 hover:text-white"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={flyUp} className="min-w-0">
                <p className="text-sm font-semibold text-white">Platform & Features</p>
                <div className="mt-4 grid gap-2 text-sm text-white/65">
                  <a className="hover:text-white" href="#features">
                    Features
                  </a>
                  <a className="hover:text-white" href="#security">
                    Security
                  </a>
                  <a className="hover:text-white" href="#about">
                    About
                  </a>
                </div>

                <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-white/45">
                  Powered by MERN & Socket.io
                </p>

                <div className="mt-5 grid gap-2 text-sm text-white/65">
                  <a className="hover:text-white" href="#">
                    Web App
                  </a>
                  <span className="text-white/40">Desktop Client (Coming Soon)</span>
                  <span className="text-white/40">Mobile Beta</span>
                </div>
              </motion.div>

              <motion.div variants={flyUp} className="min-w-0">
                <p className="text-sm font-semibold text-white">Support & Legal</p>
                <div className="mt-4 grid gap-2 text-sm text-white/65">
                  <a className="hover:text-white" href="#features">
                    How it Works
                  </a>
                  <a className="hover:text-white" href="#faq">
                    FAQ
                  </a>
                  <a className="hover:text-white" href="#">
                    Privacy Policy
                  </a>
                  <a className="hover:text-white" href="#">
                    Terms of Service
                  </a>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
                    Contact
                  </p>
                  <a
                    className="mt-2 block text-sm font-semibold text-white/75 hover:text-white"
                    href="mailto:support@yourdomain.com"
                  >
                    support@yourdomain.com
                  </a>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <div className="relative border-t border-white/10 bg-white/5 px-6 py-5 backdrop-blur sm:px-10">
            <div className="flex flex-col items-center justify-between gap-3 text-center text-xs font-semibold text-white/55 sm:flex-row sm:text-left">
              <div>© {new Date().getFullYear()} My Chat App</div>
              <div className="text-white/45">
                Built for speed, designed for privacy.
              </div>
            </div>
          </div>
          </div>
        </motion.section>
      </div>
    </footer>
  );
}

