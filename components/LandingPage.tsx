"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Terminal, Shield, FolderGit2, Cpu, Zap, LogIn, Lock } from "lucide-react";

interface LandingPageProps {
  onLoginSuccess: (username: string) => void;
}

export default function LandingPage({ onLoginSuccess }: LandingPageProps) {
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(data.username);
      } else {
        setError(data.error || "Invalid credentials. Try admin / admin");
      }
    } catch (err) {
      setError("Failed to authenticate. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden" id="landing-page">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between" id="landing-header">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20">
            <Terminal size={20} />
          </div>
          <span className="font-sans font-bold text-lg tracking-wider bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            CURLLAB
          </span>
        </div>
        <div>
          <button
            onClick={() => setShowLogin(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 hover:border-zinc-750 transition text-sm font-medium text-zinc-200 hover:text-white"
            id="login-btn-header"
          >
            <LogIn size={16} />
            <span>Login</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 md:py-20 relative max-w-7xl mx-auto w-full">
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-[150px] pointer-events-none" />

        {!showLogin ? (
          /* Hero Section */
          <div className="text-center max-w-3xl flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide mb-6"
            >
              <Zap size={12} />
              <span>Production-Ready cURL Tooling</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-sans text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1] mb-6"
            >
              The Modern cURL Playground & <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Local API Hub</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-zinc-400 text-base md:text-lg mb-8 max-w-2xl font-normal leading-relaxed"
            >
              Paste cURL commands, parse into structured HTTP components instantly, organize them in custom local folders, and route localhost requests seamlessly through a secure Local Agent.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-16"
            >
              <button
                onClick={() => setShowLogin(true)}
                className="px-8 py-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition shadow-lg shadow-indigo-600/20 text-sm flex items-center justify-center space-x-2"
                id="open-playground-hero"
              >
                <span>Open Playground</span>
                <Zap size={16} />
              </button>
              <a
                href="#features"
                className="px-8 py-3.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition text-zinc-300 hover:text-white font-semibold text-sm flex items-center justify-center"
              >
                Learn More
              </a>
            </motion.div>

            {/* Features Grid */}
            <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left border-t border-zinc-900 pt-16">
              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition">
                <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-lg w-fit mb-4">
                  <Terminal size={20} />
                </div>
                <h3 className="font-semibold text-white mb-2">cURL Parser</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Support for multi-line cURL parameters, headers, POST data-raw, Basic auth, multi-parts, cookies, and timeouts.
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition">
                <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-lg w-fit mb-4">
                  <FolderGit2 size={20} />
                </div>
                <h3 className="font-semibold text-white mb-2">Workspace Collections</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Organize saved commands with custom tags, drag requests across nested folders, and bookmark favorites.
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition">
                <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-lg w-fit mb-4">
                  <Cpu size={20} />
                </div>
                <h3 className="font-semibold text-white mb-2">Local Agent WebSocket</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Safely route requests targeting <code className="text-xs text-indigo-300">localhost</code> or private loops directly to your local computer companion.
                </p>
              </div>

              <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-xl relative overflow-hidden group hover:border-zinc-700 transition">
                <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-lg w-fit mb-4">
                  <Shield size={20} />
                </div>
                <h3 className="font-semibold text-white mb-2">SSRF Safeguard</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Ensures public cloud instances cannot be abused to access internal metadata services or cloud private ranges.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Login Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative"
            id="login-card-container"
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="bg-indigo-600/10 text-indigo-400 p-3 rounded-full mb-4">
                <Lock size={28} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verify Credentials</h2>
              <p className="text-zinc-400 text-sm">
                Enter credentials to unlock the CurlLab Playground. Default is <code className="text-indigo-400 bg-zinc-950 px-1 py-0.5 rounded">admin</code> / <code className="text-indigo-400 bg-zinc-950 px-1 py-0.5 rounded">admin</code>.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-medium text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g., admin"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-lg text-white placeholder-zinc-650 text-sm focus:outline-none focus:border-indigo-600 transition"
                  id="login-username-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-850 rounded-lg text-white placeholder-zinc-650 text-sm focus:outline-none focus:border-indigo-600 transition"
                  id="login-password-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-md hover:shadow-indigo-500/10 flex items-center justify-center space-x-2 disabled:opacity-55"
                id="login-submit-btn"
              >
                <span>{loading ? "Authenticating..." : "Unlock Dashboard"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full text-center text-xs text-zinc-400 hover:text-white transition mt-4 underline"
              >
                Back to Homepage
              </button>
            </form>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/40 py-6 px-6 text-center text-xs text-zinc-600">
        &copy; {new Date().getFullYear()} CurlLab. Securely powered by sandbox browser storage.
      </footer>
    </div>
  );
}
