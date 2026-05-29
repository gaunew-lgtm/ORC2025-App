import { BarChart2, Users, Activity } from "lucide-react";
import { LeaderboardEntry } from "../types";

interface StatsPanelProps {
  entries: LeaderboardEntry[];
}

interface MemberStats {
  name: string;
  novaMoiMatches: number;
  novaCuMatches: number;
  t1Sum: number;
  t2Sum: number;
  t3Sum: number;
  coSum: number;
  khoiSum: number;
  scoreSum: number;
}

export default function StatsPanel({ entries }: StatsPanelProps) {
  // 1. Gather all unique member names across all runs
  const memberNamesSet = new Set<string>();
  entries.forEach((entry) => {
    entry.jobs?.forEach((assignment) => {
      if (assignment.name && assignment.name.trim()) {
        memberNamesSet.add(assignment.name.trim());
      }
    });
  });

  const memberNames = Array.from(memberNamesSet).sort();

  // 2. Count statistics for each member
  const memberStatsList: MemberStats[] = memberNames.map((name) => {
    const stats: MemberStats = {
      name,
      novaMoiMatches: 0,
      novaCuMatches: 0,
      t1Sum: 0,
      t2Sum: 0,
      t3Sum: 0,
      coSum: 0,
      khoiSum: 0,
      scoreSum: 0,
    };

    entries.forEach((entry) => {
      // Find what job this member had in this match/completion
      const assignment = entry.jobs?.find((j) => j.name === name);
      if (assignment && entry.stats) {
        if (assignment.job === "Nova mới") {
          stats.novaMoiMatches += 1;
          stats.t1Sum += entry.stats.t1 || 0;
          stats.t2Sum += entry.stats.t2 || 0;
          stats.t3Sum += entry.stats.t3 || 0;
          stats.coSum += entry.stats.co || 0;
          stats.scoreSum += entry.score || 0;
        } else if (assignment.job === "Nova cũ") {
          stats.novaCuMatches += 1;
          stats.khoiSum += entry.stats.khoi || 0;
          stats.scoreSum += entry.score || 0;
        }
      }
    });

    return stats;
  });

  // Calculate team averages across every uploaded completion (not restricted to same team name)
  // For T1, T2, T3, Cò: count is the number of completions in the DB where "Nova mới" is assigned
  // For Khối: count is the number of completions in the DB where "Nova cũ" is assigned
  let totalCompletionsWithNovaMoi = 0;
  let totalCompletionsWithNovaCu = 0;
  let totalCompletionsWithJobs = 0;

  let teamT1Sum = 0;
  let teamT2Sum = 0;
  let teamT3Sum = 0;
  let teamCoSum = 0;
  let teamKhoiSum = 0;
  let teamScoreSum = 0;

  entries.forEach((entry) => {
    if (!entry.stats) return;

    const hasNovaMoi = entry.jobs?.some((j) => j.job === "Nova mới");
    const hasNovaCu = entry.jobs?.some((j) => j.job === "Nova cũ");

    if (hasNovaMoi || hasNovaCu) {
      totalCompletionsWithJobs += 1;
      teamScoreSum += entry.score || 0;
    }

    if (hasNovaMoi) {
      totalCompletionsWithNovaMoi += 1;
      teamT1Sum += entry.stats.t1 || 0;
      teamT2Sum += entry.stats.t2 || 0;
      teamT3Sum += entry.stats.t3 || 0;
      teamCoSum += entry.stats.co || 0;
    }

    if (hasNovaCu) {
      totalCompletionsWithNovaCu += 1;
      teamKhoiSum += entry.stats.khoi || 0;
    }
  });

  // Safe division helper
  const formatAverage = (sum: number, count: number) => {
    if (count === 0) return "-";
    const avg = sum / count;
    return avg.toFixed(1);
  };

  return (
    <div
      className="bg-[#fcfdff] rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 medium-blue-shadow border border-blue-100/50 min-h-[450px] sm:min-h-[600px] flex flex-col"
      id="statistics-panel"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 bg-blue-50 rounded-2xl border border-blue-200 text-blue-600">
            <BarChart2 size={18} />
          </div>
          <div>
            <h2 className="text-xl font-black text-blue-900 tracking-tight">Thống kê hiệu suất</h2>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
              Trung bình hiệu quả theo nhiệm vụ
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-grow pr-1">
        <table className="w-full text-left font-sans text-sm sm:text-base border-collapse">
          <thead>
            <tr className="border-b border-slate-100/60">
              <th className="py-3 px-2 text-[10px] sm:text-xs font-black uppercase text-blue-300 tracking-wider">
                Thành viên
              </th>
              <th className="py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase text-center text-blue-600 tracking-wider">
                Điểm TB
              </th>
              <th className="py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase text-center text-emerald-500 tracking-wider">
                T1
              </th>
              <th className="py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase text-center text-emerald-500 tracking-wider">
                T2
              </th>
              <th className="py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase text-center text-emerald-500 tracking-wider">
                T3
              </th>
              <th className="py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase text-center text-rose-500 tracking-wider">
                Khối
              </th>
              <th className="py-3 px-1 sm:px-2 text-[10px] sm:text-xs font-black uppercase text-center text-amber-500 tracking-wider">
                Cờ
              </th>
              <th className="py-3 px-1 sm:px-2 text-[8px] sm:text-[10px] font-black uppercase text-right text-blue-300 tracking-wider">
                Số trận (Mới / Cũ)
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 1. Show individual member lines */}
            {memberStatsList.map((stats) => (
              <tr
                key={stats.name}
                className="hover:bg-slate-50/50 border-b border-slate-100/40 transition-colors"
                id={`member-stat-${stats.name}`}
              >
                <td className="py-4 px-2 font-bold text-blue-900 flex items-center gap-1.5">
                  <Activity size={12} className="text-blue-400" />
                  <span>{stats.name}</span>
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-700 bg-blue-50/30 font-mono">
                  {formatAverage(stats.scoreSum, stats.novaMoiMatches + stats.novaCuMatches)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-900">
                  {formatAverage(stats.t1Sum, stats.novaMoiMatches)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-900">
                  {formatAverage(stats.t2Sum, stats.novaMoiMatches)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-900">
                  {formatAverage(stats.t3Sum, stats.novaMoiMatches)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-800">
                  {formatAverage(stats.khoiSum, stats.novaCuMatches)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-amber-600">
                  {formatAverage(stats.coSum, stats.novaMoiMatches)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-mono text-xs text-right text-slate-400">
                  <span className="text-emerald-500 font-bold">{stats.novaMoiMatches} trận</span>
                  {" / "}
                  <span className="text-rose-500 font-bold">{stats.novaCuMatches} trận</span>
                </td>
              </tr>
            ))}

            {/* If empty state */}
            {memberStatsList.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-xs font-black uppercase text-slate-300 tracking-widest bg-slate-50/40 rounded-2xl mt-4"
                >
                  Chưa có dữ liệu thống kê thành viên
                </td>
              </tr>
            )}

            {/* 2. Total Team average line (always shown, summarizing all database matches) */}
            {entries.length > 0 && (
              <tr className="bg-blue-50/70 border-t-2 border-blue-200/60 font-medium">
                <td className="py-4 px-2 font-extrabold text-blue-800 flex items-center gap-1.5">
                  <Users size={14} className="text-blue-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm">Cả đội (Trung bình)</span>
                    <span className="text-[8px] uppercase tracking-wider text-blue-400 font-black">Toàn bộ trận đấu</span>
                  </div>
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-850 text-base bg-blue-100/40 font-mono">
                  {formatAverage(teamScoreSum, totalCompletionsWithJobs)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-900 text-base">
                  {formatAverage(teamT1Sum, totalCompletionsWithNovaMoi)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-900 text-base">
                  {formatAverage(teamT2Sum, totalCompletionsWithNovaMoi)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-900 text-base">
                  {formatAverage(teamT3Sum, totalCompletionsWithNovaMoi)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-blue-800 text-base">
                  {formatAverage(teamKhoiSum, totalCompletionsWithNovaCu)}
                </td>
                <td className="py-4 px-1 sm:px-2 font-black text-center text-amber-600 text-base">
                  {formatAverage(teamCoSum, totalCompletionsWithNovaMoi)}
                </td>
                <td className="py-4 px-1 sm:px-2 text-xs font-bold text-right text-blue-500 font-mono">
                  <div className="flex flex-col items-end">
                    <span>Tổng: {entries.length} trận</span>
                    <span className="text-[9px] text-blue-400 font-black">({totalCompletionsWithNovaMoi} Mới / {totalCompletionsWithNovaCu} Cũ)</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
