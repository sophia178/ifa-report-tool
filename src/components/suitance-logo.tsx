import React from "react";

export function SuitanceLogo({ 
  textColor = "#0A1628", 
  size = 24 
}: { 
  textColor?: string; 
  size?: number 
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <svg 
        width={size + 8} 
        height={size + 8} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect width="32" height="32" rx="6" fill="#0A1628"/>
        <text 
          x="50%" 
          y="50%" 
          dominantBaseline="central" 
          textAnchor="middle" 
          fill="#C9A84C" 
          fontFamily="sans-serif" 
          fontWeight="bold" 
          fontSize="20"
        >S</text>
      </svg>
      <span style={{ 
        fontSize: `${size}px`, 
        fontWeight: "900", 
        letterSpacing: "-0.05em", 
        color: textColor,
        fontFamily: "var(--font-display), serif"
      }}>
        Suitance
      </span>
    </div>
  );
}
