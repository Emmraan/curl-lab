"use client";

import React, { useState } from "react";
import { User, LogOut, ShieldCheck, Key, RefreshCw } from "lucide-react";

interface ProfileViewProps {
  username: string;
  onLogout: () => void;
}

export default function ProfileView({ username, onLogout }: ProfileViewProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogoutClick = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        onLogout();
      }
    } catch (err) {
      console.error("Failed to logout safely:", err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] overflow-y-auto p-4 md:p-6 space-y-6" id="profile-view-container">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-lg font-bold text-white flex items-center space-x-2">
          <span>User Profile</span>
        </h2>
        <p className="text-xs text-zinc-500">
          Inspect details of your authenticated dashboard session.
        </p>
      </div>

      {/* Profile Card */}
      <div className="max-w-md bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-600/10 text-indigo-400 p-4 rounded-full border border-indigo-500/10">
            <User size={36} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">{username}</h3>
            <p className="text-xs text-zinc-500 font-mono">System Administrator</p>
          </div>
        </div>

        {/* Detailed Meta */}
        <div className="border-t border-zinc-800 pt-5 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-500 font-medium">Session Status</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono tracking-wide text-[10px] flex items-center space-x-1">
              <ShieldCheck size={11} className="mr-0.5" />
              <span>ACTIVE SESSION</span>
            </span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-500 font-medium">Authentication Type</span>
            <span className="font-mono text-zinc-300">Environment Credentials (.env)</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-zinc-500 font-medium">Session Expiry</span>
            <span className="font-mono text-zinc-300">7 Days from login</span>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleLogoutClick}
          disabled={loggingOut}
          className="w-full mt-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 font-semibold text-xs transition flex items-center justify-center space-x-2 disabled:opacity-50"
          id="profile-logout-btn"
        >
          <LogOut size={14} className="text-red-400" />
          <span>{loggingOut ? "Logging out..." : "Disconnect & Logout"}</span>
        </button>
      </div>
    </div>
  );
}
