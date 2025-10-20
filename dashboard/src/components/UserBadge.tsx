"use client";

import { User as UserIcon } from "lucide-react";
import type { User } from "@/types";

interface UserBadgeProps {
  user: User | null;
}

export default function UserBadge({ user }: UserBadgeProps) {
  if (!user) return null;

  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-neutral-800/60 to-neutral-800/40 rounded-xl border border-neutral-700/50 backdrop-blur-sm hover:border-[#ed6802]/30 transition-all duration-300 group">
      <div className="p-1.5 bg-[#ed6802]/10 rounded-lg group-hover:bg-[#ed6802]/20 transition-colors">
        <UserIcon className="w-4 h-4 text-[#ed6802]" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-[#ed6802] tracking-tight leading-none pr-9">
          {user.username}
        </span>
      </div>
    </div>
  );
}
