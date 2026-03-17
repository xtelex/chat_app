import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useTransform
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import chatIcon from "../assets/chat.png";
import videoIcon from "../assets/video.png";
import callIcon from "../assets/call.png";
import phoneImg from "../assets/phone.png";

const messagePool = [
  "pisteng yawa",
  "Hi pogii!!",
  "kamukha mo po si Joshua Garcia",
  "Crush ka daw po ng lola ko"
];

const EASE = [0.22, 1, 0.36, 1];

function makePopup(text, isMine) {
  const left = isMine ? 58 + Math.random() * 34 : 8 + Math.random() * 34;
  const top = 16 + Math.random() * 66;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    text,
    isMine,
    left,
    top
  };
}

function FeatureKeycap({ icon, title, body, led = false }) {
  return (
    <div className="relative w-full max-w-[360px]">
      <div className="pointer-events-none absolute inset-0 translate-y-10 rounded-3xl bg-black/70 blur-2xl" />

      {led ? (
        <>
          <div className="pointer-events-none absolute -bottom-10 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-red-500/40 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-6 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-red-500/60 blur-xl" />
        </>
      ) : null}

      <div className="relative rounded-3xl bg-gradient-to-b from-zinc-500/95 via-zinc-800/95 to-zinc-950 p-[12px] shadow-[0_28px_75px_rgba(0,0,0,0.75)]">
        <div className="relative overflow-hidden rounded-[1.35rem] bg-gradient-to-b from-zinc-100 to-zinc-300 px-7 py-6 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-26px_45px_rgba(0,0,0,0.16)]">
          <div className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay [background-image:repeating-linear-gradient(90deg,rgba(255,255,255,0.55)_0px,rgba(255,255,255,0.55)_1px,rgba(0,0,0,0)_6px,rgba(0,0,0,0)_12px)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(255,255,255,0.75),transparent_55%)] opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_110%,rgba(0,0,0,0.55),transparent_55%)] opacity-25" />

          <div className="relative">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-18px_30px_rgba(0,0,0,0.22)] ring-1 ring-black/10">
              <img
                alt=""
                src={icon}
                className="h-7 w-7 object-contain saturate-150 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]"
              />
            </div>

            <h3 className="mt-4 text-center text-base font-semibold [text-shadow:0_1px_0_rgba(255,255,255,0.45)]">
              {title}
            </h3>
            <p className="mt-2 text-center text-sm leading-6 text-slate-700 [text-shadow:0_1px_0_rgba(255,255,255,0.35)]">
              {body}
            </p>
          </div>
        </div>
      </div>

      {led ? (
        <div className="pointer-events-none absolute -bottom-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85),0_0_22px_rgba(239,68,68,0.55)] ring-1 ring-red-200/40" />
      ) : null}
    </div>
  );
}

export default function HowItWorksSection() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { margin: "-25% 0px -25% 0px" });
  const entered = useInView(sectionRef, { margin: "-20% 0px -40% 0px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const phoneY = useTransform(scrollYProgress, [0, 1], [24, -18]);
  const bgBlurY = useTransform(scrollYProgress, [0, 1], [10, -20]);
  const keycapY1 = useTransform(scrollYProgress, [0, 1], [10, -12]);
  const keycapY2 = useTransform(scrollYProgress, [0, 1], [18, -16]);
  const keycapY3 = useTransform(scrollYProgress, [0, 1], [14, -14]);

  const nextIndexRef = useRef(0);
  const nextSideRef = useRef(false);
  const timeoutsRef = useRef([]);

  const [popups, setPopups] = useState(() => [
    makePopup(messagePool[1], true),
    makePopup(messagePool[0], false),
    makePopup(messagePool[3], false)
  ]);

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

  const keycapsContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const keycapItem = {
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
    if (!inView) return;

    const interval = setInterval(() => {
      const idx = nextIndexRef.current % messagePool.length;
      nextIndexRef.current += 1;

      const isMine = (nextSideRef.current = !nextSideRef.current);
      const msg = makePopup(messagePool[idx], isMine);
      setPopups((prev) => [...prev, msg].slice(-5));

      const timeoutId = window.setTimeout(() => {
        setPopups((prev) => prev.filter((x) => x.id !== msg.id));
      }, 2800);
      timeoutsRef.current.push(timeoutId);
    }, 1100);

    return () => {
      clearInterval(interval);
      for (const id of timeoutsRef.current) window.clearTimeout(id);
      timeoutsRef.current = [];
    };
  }, [inView]);

  return (
    <section id="features" ref={sectionRef} className="pb-24 pt-10 sm:pb-28 sm:pt-16">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-10">
        <header className="text-center">
          <h2 className="text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Seamless Team Communication
          </h2>
        </header>

        <div className="relative mt-12 grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
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
            className="relative mx-auto w-full max-w-[520px] p-10 sm:max-w-[560px] sm:p-12"
          >
            <div className="pointer-events-none absolute -inset-16 rounded-[3rem] bg-gradient-to-tr from-red-500/25 via-fuchsia-500/15 to-pink-500/20 blur-3xl opacity-80" />

            <div className="relative mx-auto w-full max-w-[420px]">
              <motion.img
                src={phoneImg}
                alt="Phone preview"
                className="relative w-full origin-bottom-left drop-shadow-[0_35px_75px_rgba(0,0,0,0.75)]"
                initial={false}
                animate={{ rotate: -10 }}
                transition={{ type: "spring", stiffness: 60, damping: 18 }}
                style={{ y: phoneY }}
              />

              <div className="pointer-events-none absolute inset-0">
                <AnimatePresence initial={false}>
                  {popups.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10, scale: 0.92 }}
                      animate={{
                        opacity: [0, 1, 1, 0],
                        y: [10, 0, -10, -22],
                        scale: [0.92, 1, 1, 0.98]
                      }}
                      exit={{ opacity: 0, y: -26, scale: 0.98 }}
                      transition={{
                        duration: 2.7,
                        times: [0, 0.14, 0.78, 1],
                        ease: EASE
                      }}
                      style={{ left: `${m.left}%`, top: `${m.top}%` }}
                      className="absolute z-10"
                    >
                      <div
                        className={[
                          "max-w-[260px] rounded-2xl px-5 py-3.5 text-sm leading-5 shadow-[0_24px_90px_rgba(0,0,0,0.75)] backdrop-blur-2xl ring-1 ring-white/15",
                          m.isMine
                            ? "border border-fuchsia-200/25 bg-gradient-to-r from-fuchsia-500/65 to-pink-500/65 text-white"
                            : "border border-white/20 bg-slate-950/55 text-white/95"
                        ].join(" ")}
                      >
                        {m.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={keycapsContainer}
            initial="hidden"
            animate={entered ? "show" : "hidden"}
            className="relative mx-auto w-full max-w-[820px]"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:block lg:h-[520px]">
              <motion.div
                variants={keycapItem}
                className="lg:absolute lg:right-0 lg:top-2 lg:rotate-6"
                style={{ y: keycapY1 }}
              >
                <FeatureKeycap
                  icon={features[1].icon}
                  title={features[1].title}
                  body={features[1].body}
                />
              </motion.div>

              <motion.div
                variants={keycapItem}
                className="lg:absolute lg:left-0 lg:top-[170px] lg:-rotate-6"
                style={{ y: keycapY2 }}
              >
                <FeatureKeycap
                  icon={features[0].icon}
                  title={features[0].title}
                  body={features[0].body}
                  led
                />
              </motion.div>

              <motion.div
                variants={keycapItem}
                className="sm:col-span-2 lg:absolute lg:right-10 lg:top-[340px] lg:-rotate-4"
                style={{ y: keycapY3 }}
              >
                <FeatureKeycap
                  icon={features[2].icon}
                  title={features[2].title}
                  body={features[2].body}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
