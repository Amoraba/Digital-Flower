import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Mic,
  Calendar,
  Flower,
  RefreshCw,
  Search,
  ArrowLeft,
  CheckCircle2,
  Database,
  Eye,
  Share2,
  Heart
} from "lucide-react";
import { motion } from "motion/react";
import { AdminMetricsData, AnalyticsEvent, Gift } from "../types";

interface AdminDashboardProps {
  onBack: () => void;
}

export default function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [data, setData] = useState<AdminMetricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"metrics" | "events" | "gifts">("metrics");

  const fetchMetrics = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/metrics");
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      } else {
        setErrorMsg("Failed to retrieve metrics logs from the administrative endpoint.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network exception trying to access analytics portal.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getEventBadgeClass = (type: string) => {
    switch (type) {
      case "gift_created":
        return "bg-emerald-50 text-emerald-700 border-emerald-150";
      case "gift_opened":
        return "bg-blue-50 text-blue-700 border-blue-150";
      case "gift_shared":
        return "bg-purple-50 text-purple-700 border-purple-150";
      default:
        return "bg-slate-50 text-slate-700 border-slate-150";
    }
  };

  const getEventName = (type: string) => {
    switch (type) {
      case "gift_created":
        return "Gift Created 🌸";
      case "gift_opened":
        return "Gift Opened ✨";
      case "gift_shared":
        return "Gift Shared 🔗";
      default:
        return type;
    }
  };

  const filteredEvents = data?.events.filter((e) => {
    const matchesFilter = filterType === "all" || e.eventType === filterType;
    const matchesSearch =
      e.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.occasion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.flowerType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.giftId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  const filteredGifts = data?.gifts.filter((g) => {
    const matchesSearch =
      g.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.senderName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.occasion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.flowerType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.id || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  }) || [];

  return (
    <div className="max-w-4xl mx-auto my-6 p-4 sm:p-6 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl" id="admin-dashboard-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 cursor-pointer"
            id="admin-back-btn"
            title="Return to Main Portal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-2 py-0.5 rounded-full tracking-wider uppercase font-mono">
                Admin Area
              </span>
              {data?.databaseStatus.isSupabaseConfigured ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-full tracking-wider uppercase font-mono flex items-center gap-1">
                  <Database className="w-2.5 h-2.5" /> Supabase
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded-full tracking-wider uppercase font-mono">
                  Local JSON DB
                </span>
              )}
            </div>
            <h1 className="text-2xl font-serif font-bold text-white tracking-tight mt-1">Platform Analytics System</h1>
          </div>
        </div>

        <button
          onClick={fetchMetrics}
          className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-200 hover:text-white rounded-xl border border-slate-700 hover:border-slate-600 font-medium text-xs transition-colors cursor-pointer"
          id="admin-refresh-btn"
          disabled={isLoading}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="my-6 p-4 bg-rose-950/20 border border-rose-900/50 rounded-2xl text-rose-300 text-sm flex items-center space-x-3">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !data ? (
        <div className="py-20 text-center space-y-4">
          <div className="inline-block relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-rose-500/20 rounded-full animate-ping" />
            <div className="absolute inset-2 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-slate-400 text-sm font-mono tracking-wide">Compiling backend telemetry logs...</p>
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          {/* Key Deliverables Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 font-sans">
            {/* Total Gifts */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Total Gifts</span>
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight leading-none">
                {data?.metrics.totalGifts || 0}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Gifts Created</div>
            </div>

            {/* Opened Gifts */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Opened Gifts</span>
                <Eye className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight leading-none">
                {data?.metrics.openedGifts || 0}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {data?.metrics.totalGifts 
                  ? `${Math.round(((data?.metrics.openedGifts || 0) / (data?.metrics.totalGifts || 1)) * 100)}% Open Rate`
                  : "0% Open Rate"}
              </div>
            </div>

            {/* Top Flower */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Top Flower</span>
                <Flower className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-base font-bold text-white tracking-tight leading-tight truncate">
                {data?.metrics.topFlower?.split(" ")[0] || "None"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {data?.metrics.topFlower?.split("(")[1]?.replace(")", "") ? `${data.metrics.topFlower.split("(")[1].replace(")", "")} chosen` : "No gifts"}
              </div>
            </div>

            {/* Top Occasion */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Top Occasion</span>
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-base font-bold text-white tracking-tight leading-tight truncate">
                {data?.metrics.topOccasion?.split(" ")[0] || "None"}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {data?.metrics.topOccasion?.split("(")[1]?.replace(")", "") ? `${data.metrics.topOccasion.split("(")[1].replace(")", "")} chosen` : "No gifts"}
              </div>
            </div>

            {/* Voice Notes Sent */}
            <div className="bg-slate-800/50 col-span-2 md:col-span-1 p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-semibold">Voice Notes</span>
                <Mic className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white tracking-tight leading-none">
                {data?.metrics.voiceNotesSent || 0}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Recorded notes</div>
            </div>
          </div>

          {/* View Selection Tab List */}
          <div className="border-b border-slate-800 flex space-x-1 p-1 bg-slate-950/40 rounded-xl max-w-md">
            <button
              onClick={() => { setActiveTab("metrics"); setSearchQuery(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "metrics"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Analytics Table
            </button>
            <button
              onClick={() => { setActiveTab("gifts"); setSearchQuery(""); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === "gifts"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Created Gifts ({data?.gifts.length || 0})
            </button>
          </div>

          {/* Search and Filters bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-850/30 p-3 rounded-2xl border border-slate-800/50">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={activeTab === "metrics" ? "Search events (by recipient, sender, occasion, ID)..." : "Search gifts..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs border border-slate-800 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            {activeTab === "metrics" && (
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto shrink-0">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                    filterType === "all" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("gift_created")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                    filterType === "gift_created" ? "bg-emerald-950 text-emerald-300" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Created
                </button>
                <button
                  onClick={() => setFilterType("gift_opened")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                    filterType === "gift_opened" ? "bg-blue-920 text-blue-300" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Opened
                </button>
                <button
                  onClick={() => setFilterType("gift_shared")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md uppercase transition-all ${
                    filterType === "gift_shared" ? "bg-purple-950 text-purple-300" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Shared
                </button>
              </div>
            )}
          </div>

          {/* Table Renderers */}
          {activeTab === "metrics" && (
            <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-slate-950">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold selection:bg-slate-850">
                    <th className="py-2.5 px-4">Event Type</th>
                    <th className="py-2.5 px-4">Gift ID</th>
                    <th className="py-2.5 px-4">Recipient Name</th>
                    <th className="py-2.5 px-4">Sender Name</th>
                    <th className="py-2.5 px-4">Occasion & Bloom</th>
                    <th className="py-2.5 px-4 text-right">Timestamp (UTC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                        No telemetry logs match the current search query.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getEventBadgeClass(e.eventType)}`}>
                            {getEventName(e.eventType)}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                          {e.giftId}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-white">
                          {e.recipientName || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {e.senderName || "—"}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                          <span className="text-purple-300">{e.occasion || "—"}</span>
                          {e.flowerType && <span className="text-slate-500 font-serif"> • {e.flowerType}</span>}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-400 font-mono text-[10px]">
                          {e.createdAt ? new Date(e.createdAt).toLocaleString(undefined, { hour12: false }) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "gifts" && (
            <div className="overflow-x-auto border border-slate-800/80 rounded-2xl bg-slate-950">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Gift ID</th>
                    <th className="py-2.5 px-4">Recipient</th>
                    <th className="py-2.5 px-4">Sender</th>
                    <th className="py-2.5 px-4">Occasion</th>
                    <th className="py-2.5 px-4">Flower Selection</th>
                    <th className="py-2.5 px-4">Voice Memo?</th>
                    <th className="py-2.5 px-4 text-right">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredGifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500 italic">
                        No registered flower gifts found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredGifts.map((g) => (
                      <tr key={g.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-[11px] text-rose-300 select-all font-bold">
                          {g.id}
                        </td>
                        <td className="py-2.5 px-4 text-white font-semibold">
                          {g.recipientName}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {g.senderName || "Someone Special"}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded font-mono text-[10px]">
                            {g.occasion}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">
                          {g.flowerColor} {g.flowerType}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[10px]">
                          {g.voiceNoteBase64 ? (
                            <span className="text-amber-400 flex items-center gap-1 font-semibold">
                              <Mic className="w-3 h-3 text-amber-500 shrink-0" /> Yes ({Math.round(g.voiceNoteBase64.length / 1024)} KB)
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-400 font-mono text-[10px] whitespace-nowrap">
                          {g.createdAt ? new Date(g.createdAt).toLocaleString(undefined, { hour12: false }) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
