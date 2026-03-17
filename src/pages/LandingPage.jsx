import bg1 from "../assets/bg1.jpg";
import appIcon from "../assets/icon.png";
import model2 from "../assets/model2.jpeg";
import chatIcon from "../assets/chat.png";

import HowItWorksSection from "../components/HowItWorksSection.jsx";
import IntegrationsSection from "../components/IntegrationsSection.jsx";
import InnerCircleSection from "../components/InnerCircleSection.jsx";
import ReviewsSection from "../components/ReviewsSection.jsx";
import FooterSection from "../components/FooterSection.jsx";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Apple,
  ArrowRight,
  Facebook,
  Instagram,
  Mail,
  Play,
  Twitter
} from "lucide-react";

const navLinks = ["Home", "Features", "About", "Contact"];
const EASE = [0.22, 1, 0.36, 1];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [heroImageSrc, setHeroImageSrc] = useState(model2);
  const heroInView = useInView(heroRef, { margin: "-20% 0px -40% 0px" });
  const { scrollY } = useScroll();
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const bgY = useTransform(scrollY, [0, 1200], [0, -60]);
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, -44]);
  const heroCardY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const heroIconsY = useTransform(scrollYProgress, [0, 1], [0, -26]);

  const heroContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05
      }
    }
  };

  const heroGroup = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const flyUp = {
    hidden: { opacity: 0, y: 80 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 160,
        damping: 18,
        mass: 0.9
      }
    }
  };

  return (
    <div className="relative isolate min-h-[100dvh] text-slate-100 overflow-x-hidden">
      <motion.div className="pointer-events-none fixed inset-0 z-0" style={{ y: bgY }}>
        <img
          alt=""
          src={bg1}
          className="h-full w-full scale-[1.03] object-cover object-center opacity-90 saturate-125"
        />
        <div className="absolute inset-0 bg-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/70" />

        <div className="aurora-blob aurora-blob--red" />
        <div className="aurora-blob aurora-blob--deep" />
        <div className="absolute inset-0 bg-black/15" />
      </motion.div>

      <div className="fixed inset-x-0 top-0 z-30">
        <div className="pointer-events-none absolute inset-0 bg-slate-950/45 backdrop-blur-xl" />
        <div className="pointer-events-none absolute inset-0 border-b border-white/10" />

        <div className="relative mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-pink-500/30 to-fuchsia-500/20 ring-1 ring-white/10">
              <img
                src={appIcon}
                alt="App icon"
                className="h-8 w-8 rounded-full object-cover"
              />
            </div>
          </div>

          <nav className="hidden items-center gap-10 text-base font-medium text-white/70 md:flex">
            {navLinks.map((label) => (
              <a key={label} href="#" className="transition hover:text-white">
                {label}
              </a>
            ))}
          </nav>

          <motion.button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-base font-semibold text-white/90 shadow-sm backdrop-blur transition hover:bg-white/10"
          >
            Get App
            <Apple className="h-4 w-4" />
            <Play className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      <div className="relative z-10 pt-24 sm:pt-28">
        <motion.section
          ref={heroRef}
          initial="hidden"
          animate={heroInView ? "show" : "hidden"}
          variants={heroContainer}
          className="relative mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-[1400px] flex-col px-4 py-6 sm:min-h-[calc(100dvh-7rem)] sm:px-6 sm:py-8 lg:px-10"
        >
          <motion.main
            variants={heroContainer}
            className="mt-10 grid flex-1 items-center gap-10 lg:mt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
          >
            <motion.section variants={heroGroup} className="lg:pr-6">
              <motion.h1 variants={flyUp} className="text-balance text-5xl font-extrabold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
                Bringing People Closer, One Message at a Time.
              </motion.h1>
              <motion.p variants={flyUp} className="mt-5 max-w-xl text-pretty text-sm leading-6 text-white/70 sm:text-base">
                A modern chat experience built for speed and simplicity -
                connect, share, and stay in sync across devices.
              </motion.p>

              <motion.div variants={flyUp} className="mt-10 flex flex-wrap items-center gap-6">
                <motion.button
                  variants={flyUp}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-pink-500 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-pink-500/25 transition hover:bg-pink-400"
                  onClick={() => navigate("/login")}
                >
                  Start Chatting
                  <ArrowRight className="h-4 w-4" />
                </motion.button>

                <motion.button
                  variants={flyUp}
                  type="button"
                  className="group inline-flex items-center gap-4 text-left"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-tr from-pink-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/20 transition group-hover:scale-[1.03]">
                    <Play className="h-5 w-5 text-white" />
                  </span>
                  <span className="leading-tight">
                    <span className="block text-sm font-semibold">
                      Watch Intro Video
                    </span>
                    <span className="block text-xs text-white/60">
                      See how it works in 45 seconds
                    </span>
                  </span>
                </motion.button>
              </motion.div>
            </motion.section>

            <motion.section variants={heroGroup} className="relative lg:pl-2" style={{ y: heroImageY }}>
              <div className="relative mx-auto flex w-full items-center justify-center lg:justify-end">
                <motion.div variants={flyUp} className="relative w-full max-w-[940px]">
                  <div className="pointer-events-none absolute -inset-14 rounded-[2.75rem] bg-gradient-to-tr from-red-500/40 via-fuchsia-500/25 to-pink-500/35 blur-3xl opacity-80 mix-blend-screen" />
                  <div className="pointer-events-none absolute -inset-8 rounded-[2.75rem] bg-gradient-to-tr from-black/30 via-red-500/15 to-black/25 blur-2xl opacity-70" />

                  <div className="relative overflow-hidden rounded-3xl bg-white/5 shadow-[0_25px_55px_rgba(0,0,0,0.55)] ring-1 ring-white/15 backdrop-blur-sm">
                    <img
                      src={heroImageSrc}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 h-full w-full scale-[1.12] object-cover blur-2xl opacity-85"
                    />

                    <div className="relative p-[6px]">
                      <img
                        src={heroImageSrc}
                        alt="Chat illustration"
                        onError={() => {
                          setHeroImageSrc((current) =>
                            current === chatIcon ? current : chatIcon
                          );
                        }}
                        className="h-[clamp(280px,30vw,520px)] w-full rounded-[1.35rem] object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                      />
                    </div>

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                  </div>

                  <motion.div
                    variants={flyUp}
                    style={{ y: heroCardY }}
                    className="absolute -bottom-6 left-1/2 w-[min(26rem,92%)] -translate-x-1/2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur"
                  >
                    <div className="flex items-center gap-4">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-fuchsia-500/90 text-lg font-bold">
                        8.6m
                      </div>
                      <div className="text-sm text-white/80">
                        <p className="font-semibold text-white">Active users</p>
                        <p className="mt-1 text-xs text-white/60">
                          Millions of conversations, delivered instantly.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </motion.section>
          </motion.main>

          <motion.footer variants={flyUp} style={{ y: heroIconsY }} className="mt-auto flex items-end justify-start pb-6 sm:pb-8">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Mail, label: "Email" }
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/5 text-white/80 shadow-sm backdrop-blur transition hover:bg-white/10 hover:text-white"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.footer>
        </motion.section>

        <HowItWorksSection />
        <IntegrationsSection />
        <InnerCircleSection />
        <ReviewsSection />
        <FooterSection />
      </div>
    </div>
  );
}
