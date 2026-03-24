import {
  motion,
  useInView,
  useScroll,
  useTransform
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import securityVideo from "../assets/mockrocket-export (1).mp4";

export default function IntegrationsSection() {
  const sectionRef = useRef(null);
  const entered = useInView(sectionRef, { margin: "-20% 0px -40% 0px" });
  const videoRef = useRef(null);
  const videoStartedRef = useRef(false);
  const videoEndedRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const explanation = useMemo(
    () =>
      "Everything you share is protected. Messages, photos, voice notes, and files stay private - designed for secure conversations from start to finish.",
    []
  );
  const [typedText, setTypedText] = useState("");
  const lastTypedCountRef = useRef(-1);
  const textOpacity = useTransform(scrollYProgress, [0.12, 0.22], [0, 1]);
  const textY = useTransform(scrollYProgress, [0, 0.25], [12, 0]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    let rafId = 0;
    const cancel = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const tick = () => {
      const duration = el.duration;
      const ratio =
        duration && Number.isFinite(duration)
          ? Math.min(1, Math.max(0, el.currentTime / duration))
          : 0;

      const nextCount = Math.round(ratio * explanation.length);
      if (nextCount !== lastTypedCountRef.current) {
        lastTypedCountRef.current = nextCount;
        setTypedText(explanation.slice(0, nextCount));
      }

      if (!el.paused && !el.ended) rafId = window.requestAnimationFrame(tick);
    };

    const onPlay = () => {
      cancel();
      rafId = window.requestAnimationFrame(tick);
    };

    const onPause = () => cancel();

    const onEnded = () => {
      videoEndedRef.current = true;
      cancel();
      lastTypedCountRef.current = explanation.length;
      setTypedText(explanation);
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      cancel();
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [explanation]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (!entered) {
      el.pause();
      videoStartedRef.current = false;
      videoEndedRef.current = false;
      lastTypedCountRef.current = -1;
      setTypedText("");
    }
  }, [entered]);

  useEffect(() => {
    if (!entered) return;

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;

        if (videoEndedRef.current) return;

        const el = videoRef.current;
        if (!el) return;

        if (!videoStartedRef.current) {
          videoStartedRef.current = true;
          try {
            el.currentTime = 0;
          } catch {}
          lastTypedCountRef.current = -1;
          setTypedText("");
        }

        const p = el.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onScroll, { passive: true });
    window.addEventListener("touchmove", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onScroll);
      window.removeEventListener("touchmove", onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [entered]);

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
    <section
      id="security"
      ref={sectionRef}
      className="relative pb-24 pt-6 sm:pb-28 sm:pt-10"
    >
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
      </div>

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

        <div className="relative w-full overflow-hidden border-y border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_40%),radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.14),transparent_45%)]" />

          <div className="relative mx-auto w-full max-w-[1400px] px-6 py-16 sm:px-10 sm:py-20">
            <motion.div variants={flyUp} className="relative mx-auto w-full max-w-[1320px]">
              <div className="pointer-events-none absolute -inset-12 rounded-[2.75rem] bg-gradient-to-tr from-fuchsia-500/20 via-sky-500/10 to-rose-500/15 blur-3xl opacity-90" />

              <div className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/5 shadow-[0_40px_110px_rgba(0,0,0,0.65)] backdrop-blur">
                <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.22),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(217,70,239,0.18),transparent_55%)]" />
                <motion.div
                  className="pointer-events-none absolute inset-y-0 left-0 z-20 flex w-[58%] flex-col justify-center px-10 sm:px-14 lg:px-16"
                  style={{ opacity: textOpacity, y: textY }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-transparent blur-2xl" />
                  <div className="relative">
                    <p className="text-lg font-extrabold uppercase tracking-[0.42em] text-white sm:text-xl lg:text-2xl">
                      Security
                    </p>
                    <p className="mt-4 text-pretty text-lg font-semibold leading-8 text-white sm:text-xl sm:leading-9">
                      {typedText}
                      <span
                        aria-hidden="true"
                        className="ml-1 inline-block h-5 w-[2px] translate-y-1 animate-pulse rounded-full bg-white/80 align-middle"
                        style={{
                          opacity:
                            typedText.length >= explanation.length ? 0 : 1
                        }}
                      />
                    </p>
                  </div>
                </motion.div>

                <video
                  className="relative z-10 h-[380px] w-full object-cover sm:h-[460px] lg:h-[540px]"
                  src={securityVideo}
                  muted
                  playsInline
                  preload="metadata"
                  ref={videoRef}
                  disablePictureInPicture
                  controlsList="nodownload noremoteplayback noplaybackrate"
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
