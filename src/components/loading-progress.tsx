"use client";

import { useState, useEffect } from "react";

interface LoadingProgressProps {
  isLoading: boolean;
  messages?: string[];
}

export function LoadingProgress({ isLoading, messages = [
  "Analysing client profile...",
  "Applying regulatory framework...",
  "Drafting report sections...",
  "Running compliance checks...",
  "Finalising your report..."
] }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions, react-hooks/set-state-in-effect
      setProgress(100);
      return;
    }

    // Reset for new loading session
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, react-hooks/set-state-in-effect
    setProgress(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions, react-hooks/set-state-in-effect
    setMessageIndex(0);

    // Fill progress bar over 30 seconds
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // Stay at 95% until done
        return prev + 1;
      });
    }, 300);

    // Rotate messages every 4 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [isLoading, messages]);

  if (!isLoading && progress === 100) return null;

  return (
    <div className="w-full space-y-4 py-8">
      <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-[#C9A84C] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-2">
        <p className="text-[#0A1628] font-bold animate-pulse">
          {messages[messageIndex]}
        </p>
        <p className="text-xs text-gray-400 uppercase tracking-widest">
          Please wait while our AI works
        </p>
      </div>
    </div>
  );
}
