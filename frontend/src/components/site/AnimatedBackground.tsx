"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function AnimatedBackground() {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.2);
  const sx = useSpring(mx, { stiffness: 60, damping: 20, mass: 1 });
  const sy = useSpring(my, { stiffness: 60, damping: 20, mass: 1 });
  const bg = useTransform([sx, sy], ([x, y]) => {
    const cx = Math.round(x * 100);
    const cy = Math.round(y * 100);
    return `radial-gradient(800px 400px at ${cx}% ${cy}%, rgba(99,102,241,0.20), transparent)`;
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      mx.set(x);
      my.set(Math.max(0, y - 0.2));
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <motion.div
      aria-hidden
      style={{ backgroundImage: bg as any }}
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}


