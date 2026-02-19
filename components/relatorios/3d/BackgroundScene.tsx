import React from "react";

export default function BackgroundScene() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* Solid background - uses Tailwind dark: class, no JS needed */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" />
      
      {/* Subtle dot grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.35] dark:opacity-[0.15]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />
    </div>
  );
}
