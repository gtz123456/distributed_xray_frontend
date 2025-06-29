"use client";

import { useState, useRef, ReactNode } from "react";

interface GlowingCardProps {
  children: ReactNode;
  /**
   * Tailwind CSS classes for dimensions and additional styles.
   * Default: w-48 h-48
   */
  className?: string;
}

export default function GlowingCard({ children, className = "w-48 h-48" }: GlowingCardProps) {
  const [isHover, setIsHover] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      className={`relative overflow-hidden rounded-lg border border-gray-600 transition-shadow duration-200 ${className}`}
      style={{
        // Hover glow box-shadow
        boxShadow: isHover
          ? "0 0 15px 4px rgba(59,248,251,0.5)"
          : "none"
      }}
    >
      {/* Glow effect overlay placed above content */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg transition-opacity duration-200 z-10"
        style={{
          opacity: isHover ? 1 : 0,
          background: `radial-gradient(950px circle at ${coords.x}px ${coords.y}px, rgba(59,248,251,0.1), transparent 20%)`,
        }}
      />

      {/* Inner content background always active */}
      <div className="relative bg-[#231941] rounded-lg w-full h-full p-2 z-0">
        {children}
      </div>
    </div>
  );
}
