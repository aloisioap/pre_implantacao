"use client";

import { useEffect, useRef, useState } from "react";

interface SlideToUnlockProps {
  onConfirm: () => void;
  label?: string;
  color?: string;
  disabled?: boolean;
}

export default function SlideToUnlock({
  onConfirm,
  label = "Slide para confirmar",
  color = "#dc2626",
  disabled = false,
}: SlideToUnlockProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    if (disabled) return;
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const maxX = rect.width - 60; // thumb width (60px)
    const progress = Math.max(0, Math.min(x, maxX)) / maxX;

    setDragProgress(progress);

    // Se arrastar até 80%, dispara confirmação
    if (progress >= 0.8) {
      onConfirm();
      setDragging(false);
      setDragProgress(0);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (dragProgress < 0.8) {
      setDragProgress(0);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const maxX = rect.width - 60;
    const progress = Math.max(0, Math.min(x, maxX)) / maxX;

    setDragProgress(progress);

    if (progress >= 0.8) {
      onConfirm();
      setIsDragging(false);
      setDragProgress(0);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (dragProgress < 0.8) {
      setDragProgress(0);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener("mousemove", handleMouseMove as EventListener);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove as EventListener);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove as EventListener);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove as EventListener);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, dragProgress]);

  return (
    <div
      ref={containerRef}
      className={`
        relative
        h-12
        rounded-full
        border-2
        cursor-grab
        active:cursor-grabbing
        transition-colors
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
      style={{
        borderColor: color,
        backgroundColor: `${color}08`,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* Background fill */}
      <div
        className="absolute inset-0 rounded-full transition-all"
        style={{
          backgroundColor: `${color}20`,
          width: `${dragProgress * 100}%`,
        }}
      />

      {/* Thumb */}
      <div
        ref={thumbRef}
        className={`
          absolute
          top-1
          left-1
          w-10
          h-10
          rounded-full
          flex
          items-center
          justify-center
          text-white
          font-black
          text-sm
          transition-all
          select-none
        `}
        style={{
          backgroundColor: color,
          transform: `translateX(${dragProgress * (containerRef.current ? containerRef.current.clientWidth - 60 : 0)}px)`,
          cursor: disabled ? "not-allowed" : "grab",
        }}
      >
        {dragProgress < 0.3 && (
          <span className="text-xs">→</span>
        )}
        {dragProgress >= 0.3 && dragProgress < 0.8 && (
          <span className="text-xs animate-pulse">→</span>
        )}
        {dragProgress >= 0.8 && (
          <span className="text-xs">✓</span>
        )}
      </div>

      {/* Text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity"
        style={{
          opacity: 1 - dragProgress,
          color: color,
        }}
      >
        <span className="text-xs font-black">{label}</span>
      </div>
    </div>
  );
}
