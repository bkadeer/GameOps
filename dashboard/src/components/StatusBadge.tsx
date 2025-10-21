"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "custom";
type BadgeSize = "sm" | "md" | "lg";

interface StatusBadgeProps {
  icon?: LucideIcon;
  iconElement?: ReactNode; // For custom icon elements (like animated icons)
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  customColors?: {
    bg?: string;
    border?: string;
    text?: string;
    icon?: string;
    shadow?: string;
  };
  animate?: boolean; // For ping animation
  className?: string;
  children?: ReactNode; // For completely custom content
}

export default function StatusBadge({
  icon: Icon,
  iconElement,
  label,
  variant = "neutral",
  size = "md",
  customColors,
  animate = false,
  className = "",
  children,
}: StatusBadgeProps) {
  // Variant color schemes
  const variantStyles = {
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      icon: "text-emerald-400",
      shadow: "shadow-emerald-500/10",
    },
    warning: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-400",
      icon: "text-amber-400",
      shadow: "shadow-amber-500/10",
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-400",
      icon: "text-red-400",
      shadow: "shadow-red-500/10",
    },
    info: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      text: "text-blue-400",
      icon: "text-blue-400",
      shadow: "shadow-blue-500/10",
    },
    neutral: {
      bg: "bg-gray-500/10",
      border: "border-gray-500/30",
      text: "text-gray-400",
      icon: "text-gray-400",
      shadow: "shadow-gray-500/10",
    },
    custom: {
      bg: customColors?.bg || "bg-gray-500/10",
      border: customColors?.border || "border-gray-500/30",
      text: customColors?.text || "text-gray-400",
      icon: customColors?.icon || "text-gray-400",
      shadow: customColors?.shadow || "shadow-gray-500/10",
    },
  };

  // Size configurations
  const sizeStyles = {
    sm: {
      container: "px-3 py-1.5 gap-2 rounded-lg",
      icon: "w-3.5 h-3.5",
      text: "text-xs",
    },
    md: {
      container: "pl-1 pr-3 py-1 gap-2.5 rounded-full",
      icon: "w-4 h-4",
      text: "text-xs",
    },
    lg: {
      container: "flex items-center px-1 py-1 gap-2.5 rounded-full",
      icon: "w-4 h-4",
      text: "text-lg",
    },
  };

  const colors = variantStyles[variant];
  const sizes = sizeStyles[size];

  // If children provided, use custom content
  if (children) {
    return (
      <div
        className={`flex items-center ${sizes.container} ${colors.bg} border ${colors.border} ${colors.shadow} shadow-lg transition-all duration-300 ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center ${sizes.container} ${colors.bg} border ${colors.border} ${colors.shadow} shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Icon */}
      {(Icon || iconElement) && (
        <div className="relative">
          {iconElement ? (
            iconElement
          ) : Icon ? (
            <Icon className={`${sizes.icon} ${colors.icon}`} />
          ) : null}
          
          {/* Ping animation */}
          {animate && Icon && (
            <div className="absolute inset-0 animate-ping">
              <Icon className={`${sizes.icon} ${colors.icon} opacity-40`} />
            </div>
          )}
        </div>
      )}

      {/* Label */}
      {label && (
        <span className={`${sizes.text} font-semibold tracking-wide ${colors.text}`}>
          {label}
        </span>
      )}
    </div>
  );
}
