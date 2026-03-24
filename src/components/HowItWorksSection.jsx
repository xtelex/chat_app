import {
  motion,
  useInView,
  useScroll,
  useTransform
} from "motion/react";
import { useEffect, useMemo, useRef } from "react";

import chatIcon from "../assets/chat.png";
import videoIcon from "../assets/video.png";
import callIcon from "../assets/call.png";
import mockrocketVideo from "../assets/mockrocket-export.mp4";

const EASE = [0.22, 1, 0.36, 1];

export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const entered = useInView(sectionRef, { margin: "-20% 0px -40% 0px" });
  const videoRef = useRef(null);
  const videoStartedRef = useRef(false);
  const videoEndedRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const bgBlurY = useTransform(scrollYProgress, [0, 1], [10, -20]);

  const features = useMemo(
    () => [
      {
        icon: chatIcon,
        title: "Realtime messaging",
        body: "Send and receive messages instantly with smooth, reliable sync."
      },
      {
        icon: videoIcon,
        title: "Sharing images and Videos",
        body: "Share photos and clips in seconds, right inside your chat."
      },
      {
        icon: callIcon,
        title: "Call your favorite person",
        body: "Jump on a call and keep the conversation going."
      }
    ],
    []
  );

  const featuresContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const featureItem = {
    hidden: { opacity: 0, scale: 0.8, y: 34 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.7, ease: EASE }
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

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (!entered) {
      el.pause();
      videoStartedRef.current = false;
      videoEndedRef.current = false;
      try {
        el.currentTime = 0;
      } catch {}
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

  return (
    <section id="features" ref={sectionRef} className="pb-24 pt-10 sm:pb-28 sm:pt-16">
      <div className="w-full">
        <div className="relative w-full overflow-hidden border-y border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.65)] backdrop-blur">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-50/95 via-white/85 to-rose-100/90" />
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_18%_20%,rgba(244,63,94,0.18),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(217,70,239,0.12),transparent_48%)]" />

          <div className="relative mx-auto w-full max-w-[1400px] px-6 py-14 sm:px-10 sm:py-16">
            <header className="text-center">
              <h2 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Seamless Team Communication
              </h2>
            </header>

            <div className="relative mt-12 grid items-center gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:gap-14">
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-20 -z-10 blur-3xl"
                style={{ y: bgBlurY }}
              >
                <div className="absolute left-[6%] top-[18%] h-48 w-72 rounded-full bg-fuchsia-500/10" />
                <div className="absolute right-[8%] top-[34%] h-56 w-80 rounded-full bg-red-500/10" />
              </motion.div>

              <motion.div
                variants={flyUp}
                initial="hidden"
                animate={entered ? "show" : "hidden"}
                className="relative mx-auto w-full max-w-none sm:max-w-[920px] lg:mx-0 lg:-ml-6 lg:justify-self-start"
              >
                <div className="pointer-events-none absolute -inset-16 rounded-[3rem] bg-gradient-to-tr from-red-500/25 via-fuchsia-500/15 to-pink-500/20 blur-3xl opacity-80" />

                <div className="relative h-[240px] w-full overflow-hidden rounded-3xl bg-black/10 shadow-[0_35px_75px_rgba(0,0,0,0.35)] ring-1 ring-black/10 backdrop-blur sm:h-[360px] lg:h-[min(520px,60vh)]">
                  <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_25%_10%,rgba(255,255,255,0.55),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(244,63,94,0.25),transparent_55%)]" />
                  <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-rose-50/80 via-rose-50/25 to-transparent backdrop-blur-2xl sm:w-28" />
                  <video
                    className="relative z-10 h-full w-full object-cover"
                    src={mockrocketVideo}
                    muted
                    playsInline
                    disablePictureInPicture
                    controlsList="nodownload noremoteplayback noplaybackrate"
                    preload="metadata"
                    ref={videoRef}
                    onContextMenu={(e) => e.preventDefault()}
                    onEnded={() => {
                      videoEndedRef.current = true;
                    }}
                  />
                </div>
              </motion.div>

              <motion.div
                variants={featuresContainer}
                initial="hidden"
                animate={entered ? "show" : "hidden"}
                className="w-full lg:justify-self-end lg:self-center"
              >
                <div className="space-y-10">
                  {features.map((feature) => (
                    <motion.div key={feature.title} variants={featureItem}>
                      <div className="flex items-start gap-4">
                        <div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-black/10 ring-1 ring-black/10 backdrop-blur">
                          <img
                            alt=""
                            src={feature.icon}
                            className="h-6 w-6 object-contain saturate-150 drop-shadow-[0_6px_10px_rgba(0,0,0,0.25)]"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {feature.title}
                          </h3>
                          <p className="mt-2 text-base leading-7 text-slate-700">
                            {feature.body}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
