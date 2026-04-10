"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TypewriterEffectProps {
  words: Array<{
    text: string;
    className?: string;
  }>;
  className?: string;
  cursorClassName?: string;
}

export function TypewriterEffect({
  words,
  className,
  cursorClassName,
}: TypewriterEffectProps) {
  const [displayText, setDisplayText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const fullText = words.map((w) => w.text).join(" ");

  // Cursor blink
  useEffect(() => {
    const cursor = setInterval(() => setShowCursor((p) => !p), 500);
    return () => clearInterval(cursor);
  }, []);

  useEffect(() => {
    const currentWord = words[wordIndex];
    if (!currentWord) return;

    const speed = isDeleting ? 50 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentWord.text.length) {
          setDisplayText(currentWord.text.slice(0, charIndex + 1));
          setCharIndex((c) => c + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentWord.text.slice(0, charIndex - 1));
          setCharIndex((c) => c - 1);
        } else {
          setIsDeleting(false);
          setWordIndex((w) => (w + 1) % words.length);
        }
      }
    }, speed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, wordIndex, words]);

  const currentWord = words[wordIndex];

  return (
    <div className={cn("inline-flex items-center", className)}>
      <span className={cn("", currentWord?.className)}>{displayText}</span>
      <motion.span
        animate={{ opacity: showCursor ? 1 : 0 }}
        transition={{ duration: 0.1 }}
        className={cn(
          "inline-block w-[2px] h-[1em] ml-0.5 align-middle bg-neon-cyan",
          cursorClassName
        )}
      />
    </div>
  );
}

// Simple one-shot typewriter
export function TypewriterOnce({
  text,
  speed = 50,
  delay = 0,
  className,
  onComplete,
}: {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setDone(true);
          onComplete?.();
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="inline-block w-[2px] h-[0.9em] ml-0.5 align-middle bg-neon-cyan animate-pulse" />
      )}
    </span>
  );
}
