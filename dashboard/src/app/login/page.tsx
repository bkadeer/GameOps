"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { authAPI } from "@/lib/api";
import { useStore } from "@/store/useStore";
import SpaceBackground from "@/components/SpaceBackground";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!password) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.login(username, password);
      localStorage.setItem("access_token", data.access_token);

      // Set user in store (you'll need to fetch user details)
      setUser({
        id: "1",
        username,
        email: "",
        role: "ADMIN",
        account_balance: 0,
        created_at: new Date().toISOString(),
      });

      toast.success("Welcome back!");
      router.push("/");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Invalid username or password";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Space Background */}
      <SpaceBackground />

      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-[520px] animate-fade-in">
          {/* Glass-morphic Card */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-[1px] bg-gradient-to-br from-[#D97A32]/10 via-transparent to-[#D97A32]/5 rounded-[32px] blur-xl"></div>

            {/* Main card */}
            <div className="relative bg-[rgba(28,28,28,0.4)] backdrop-blur-2xl rounded-[32px] border border-[#D97A32]/10 px-16 py-16">
              {/* Centered Controller Icon */}
              <div className="flex justify-center mb-14">
                <div className="relative group cursor-pointer">
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-[#D97A32] rounded-2xl blur-3xl opacity-0 group-hover:opacity-40 transition-all duration-700"></div>
                  <div className="absolute inset-0 bg-[#D97A32] rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-all duration-500"></div>

                  {/* Icon container */}
                  <div className="relative w-24 h-24 bg-gradient-to-br from-[#D97A32]/10 to-[#E5893B]/5 backdrop-blur-sm border border-[#D97A32]/20 group-hover:border-[#D97A32]/40 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-105">
                    <Gamepad2
                      className="w-12 h-12 text-[#D97A32] group-hover:text-[#E5893B] transition-colors duration-500"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="mb-14 text-center">
                <h1 className="text-[32px] font-light text-[#FFFFFF] mb-3 tracking-wide">
                  Welcome Back
                </h1>
                <div className="h-[1px] w-20 bg-gradient-to-r from-transparent via-[#D97A32] to-transparent mb-5 mx-auto"></div>
                <p className="text-[#9CA3AF] text-[15px] font-light tracking-wide">
                  Access your command center
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </div>
              )}

              <link
                href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap"
                rel="stylesheet"
              />

              <form onSubmit={handleSubmit} className="space-y-11">
                {/* Username Field */}
                <div className="space-y-4 group">
                  <label
                    htmlFor="username"
                    className="block text-[12px] font-medium text-[#9CA3AF] uppercase tracking-[0.2em]"
                  >
                    Account Name
                  </label>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="relative w-full px-8 py-4 bg-[rgba(10,10,10,0.3)] border border-[#2a2a2a] group-hover:border-[#D97A32]/30 rounded-xl text-[16px] text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:border-[#D97A32] transition-all duration-900 tracking-wide"
                      placeholder="username or email"
                      required
                      autoComplete="username"
                      style={{
                        fontFamily: "'Poppins', sans-serif",
                        letterSpacing: "0.08em", // Slightly more elegant spacing
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-4 group">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-[12px] font-medium text-[#9CA3AF] uppercase tracking-[0.2em]"
                    >
                      Slap your password
                    </label>
                    <a
                      href="#"
                      className="text-[12px] text-[#6B7280] hover:text-[#D97A32] transition-colors tracking-wider"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="relative w-full px-6 py-4 bg-[rgba(10,10,10,0.3)] border border-[#2a2a2a] group-hover:border-[#D97A32]/30 rounded-xl text-[16px] text-[#FFFFFF] placeholder-[#6B7280] focus:outline-none focus:border-[#D97A32] transition-all duration-500 pr-14 font-mono tracking-wider"
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-[#6B7280] hover:text-[#D97A32] transition-colors z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                      ) : (
                        <Eye className="w-5 h-5" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full mt-12 py-4 bg-gradient-to-r from-[#D97A32] to-[#E5893B] hover:from-[#E5893B] hover:to-[#F09850] text-white text-[14px] font-medium rounded-full transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-[0.2em] overflow-hidden"
                >
                  <span className="relative z-10">
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Authenticating
                      </span>
                    ) : (
                      "Ignite"
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-12 pt-10 border-t border-[#2a2a2a]/50">
                <p className="text-center text-[12px] text-[#6B7280] tracking-wide">
                  Restricted access ·{" "}
                  <a
                    href="#"
                    className="text-[#D97A32] hover:text-[#E5893B] transition-colors"
                  >
                    Request credentials
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
