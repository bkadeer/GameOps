"use client";

import { User as UserIcon } from "lucide-react";
import type { User } from "@/types";
import StatusBadge from "./StatusBadge";

interface UserBadgeProps {
  user: User | null;
}

export default function UserBadge({ user }: UserBadgeProps) {
  if (!user) return null;

  return (
    <StatusBadge
      variant="custom"
      size="md"
      customColors={{
        bg: "bg-gradient-to-r from-neutral-800/60 to-neutral-800/40",
        border: "border-neutral-700/50",
        text: "text-[#ed6802]",
        icon: "text-[#ed6802]",
      }}
      className="backdrop-blur-sm hover:border-[#ed6802]/30 group"
    >
      <div className="p-1.5 bg-[#ed6802]/10 rounded-lg group-hover:bg-[#ed6802]/20 transition-colors">
        <UserIcon className="w-4 h-4 text-[#ed6802]" />
      </div>
      <span className="text-sm font-semibold text-[#ed6802] tracking-tight leading-none">
        {user.username}
      </span>
    </StatusBadge>
  );
}
