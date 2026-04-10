"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface BackgroundLightsProps {
  className?: string;
  variant?: "splash" | "feed" | "subtle";
}

export function BackgroundLights({
  className,
  variant = "splash",
}: BackgroundLightsProps) {
  if (variant === "subtle") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-neon-purple/5 rounded-full blur-3xl" />
      </div>
    );
  }

  if (variant === "feed") {
    return (
      <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
        <motion.div
          animate={{ opacity: [0.03, 0.07, 0.03], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-neon-cyan rounded-full blur-[120px]"
        />
      </div>
    );
  }

  // Splash variant — full dramatic
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      {/* Primary orb - top center */}
      <motion.div
        animate={{
          opacity: [0.15, 0.3, 0.15],
          scale: [1, 1.2, 1],
          x: [0, 30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-neon-cyan rounded-full blur-[120px]"
      />

      {/* Secondary orb - bottom left */}
      <motion.div
        animate={{
          opacity: [0.1, 0.25, 0.1],
          scale: [1, 1.15, 1],
          y: [0, -20, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-neon-purple rounded-full blur-[100px]"
      />

      {/* Accent orb - right */}
      <motion.div
        animate={{
          opacity: [0.08, 0.2, 0.08],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute top-1/3 -right-20 w-[350px] h-[350px] bg-neon-pink rounded-full blur-[100px]"
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,245,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Scan line */}
      <motion.div
        animate={{ y: ["0%", "100%"] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent"
      />
    </div>
  );
}

// 3D Abstract sphere for splash screen
export function AbstractSphere({ className }: { className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-full h-full"
      >
        <svg viewBox="0 0 300 300" className="w-full h-full">
          <defs>
            <radialGradient id="sphereGrad" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#bf5af2" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0a0a0f" stopOpacity="0.9" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Sphere base */}
          <circle cx="150" cy="150" r="120" fill="url(#sphereGrad)" />

          {/* Orbit rings */}
          <ellipse
            cx="150"
            cy="150"
            rx="120"
            ry="30"
            fill="none"
            stroke="#00f5ff"
            strokeWidth="1"
            strokeOpacity="0.4"
            filter="url(#glow)"
          />
          <ellipse
            cx="150"
            cy="150"
            rx="90"
            ry="120"
            fill="none"
            stroke="#bf5af2"
            strokeWidth="1"
            strokeOpacity="0.3"
            transform="rotate(45 150 150)"
            filter="url(#glow)"
          />
          <ellipse
            cx="150"
            cy="150"
            rx="105"
            ry="40"
            fill="none"
            stroke="#ff375f"
            strokeWidth="1"
            strokeOpacity="0.25"
            transform="rotate(-30 150 150)"
            filter="url(#glow)"
          />

          {/* Highlight */}
          <ellipse
            cx="110"
            cy="105"
            rx="35"
            ry="20"
            fill="white"
            fillOpacity="0.08"
          />

          {/* Nodes on orbit */}
          <circle cx="270" cy="150" r="4" fill="#00f5ff" filter="url(#glow)" />
          <circle cx="30" cy="150" r="4" fill="#00f5ff" filter="url(#glow)" />
          <circle cx="150" cy="270" r="3" fill="#bf5af2" filter="url(#glow)" />
          <circle cx="150" cy="30" r="3" fill="#bf5af2" filter="url(#glow)" />
        </svg>
      </motion.div>

      {/* Glow underneath */}
      <div className="absolute inset-0 rounded-full bg-neon-cyan/10 blur-3xl -z-10" />
    </div>
  );
}
