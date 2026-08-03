import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface SplashScreenProps {
  onDone: () => void;
}

const DURATION_MS = 1800;
const iconSrc = `${import.meta.env.BASE_URL}icons/icon-192.png`;

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const preferReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const showMs = preferReduced ? 400 : DURATION_MS;
    const exitMs = preferReduced ? 150 : 350;

    const t1 = window.setTimeout(() => setExiting(true), showMs);
    const t2 = window.setTimeout(onDone, showMs + exitMs);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      aria-label="Loading Layout Canvas"
      aria-busy={!exiting}
    >
      <img
        src={iconSrc}
        alt=""
        width={72}
        height={72}
        className="w-[72px] h-[72px] rounded-[18px]"
      />

      <div className="mt-10 w-28 h-[2px] rounded-full bg-white/15 overflow-hidden">
        <motion.div
          className="h-full bg-white rounded-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: DURATION_MS / 1000,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      </div>
    </motion.div>
  );
}
