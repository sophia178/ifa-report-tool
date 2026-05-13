"use client";

import { useState, useEffect } from "react";

interface LoadingProgressProps {
  isLoading: boolean;
  messages?: string[];
}

export function LoadingProgress({ isLoading, messages = [
  "Connecting to AI...",
  "Analysing your input...",
  "Generating content...",
  "Almost ready..."
] }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    // Initialize progress bar over 30 seconds (100% / 30s = 3.33% per second)
    const totalDuration = 30000;
    const intervalTime = 100; // Update every 100ms
    const increment = 100 / (totalDuration / intervalTime);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(prev + increment, 100);
      });
    }, intervalTime);

    // Rotate messages every 4 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      // Reset state for next time
      setProgress(0);
      setMessageIndex(0);
    };
  }, [isLoading, messages.length]);

  if (!isLoading) return null;

  return (
    <div style={{ width: "100%", padding: "20px 0", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ position: "relative", height: "8px", width: "100%", backgroundColor: "#F3F4F6", borderRadius: "4px", overflow: "hidden" }}>
        <div 
          style={{ 
            position: "absolute", 
            top: 0, 
            left: 0, 
            height: "100%", 
            backgroundColor: "#C9A84C", 
            transition: "width 0.1s linear",
            width: `${progress}%`,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <p style={{ color: "#374151", fontWeight: "600", fontSize: "14px", margin: 0 }}>
          {messages[messageIndex]}
        </p>
      </div>
    </div>
  );
}
