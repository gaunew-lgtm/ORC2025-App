import { useState } from "react";
import { LeaderboardEntry } from "../types";
import { Trophy, Pencil, Trash2, X, Calendar } from "lucide-react";

interface AllTimeRecordsPanelProps {
  entries: LeaderboardEntry[];
  onDeleteEntry: (id: string) => Promise<void>;
  onEditEntry: (entry: LeaderboardEntry) => void;
  editingId: string | null;
}

export default function AllTimeRecordsPanel({
  entries,
  onDeleteEntry,
  onEditEntry,
  editingId,
}: AllTimeRecordsPanelProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"top5" | "more">("top5");

  // Helper to format date key 'YYYY-MM-DD'
  const getLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helper to format date string to 'Ngày DD/MM/YYYY'
  const formatLocalDate = (dateStr: string) => {
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${dd}/${mm}/${yyyy}`;
  };

  // Group all entries by local date and select the highest-scoring one for each day
  const recordsByDay: Record<string, LeaderboardEntry> = {};
  entries.forEach((entry) => {
    const dateKey = getLocalDateString(entry.createdAt);
    const existing = recordsByDay[dateKey];
    if (!existing || entry.score > existing.score) {
      recordsByDay[dateKey] = entry;
    }
  });

  // Convert grouped object to array and sort chronologically descending (newest day first)
  // or sort by score descending (absolute highest score of all history first)
  // Let's sort by score descending to represent "all-time records leaderboard"
  const sortedDayRecords = Object.entries(recordsByDay)
    .map(([dateKey, entry]) => ({
      dateKey,
      entry,
    }))
    .sort((a, b) => b.entry.score - a.entry.score);

  const recordsWithRank = sortedDayRecords.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));

  const top5Records = recordsWithRank.slice(0, 5);
  const moreRecords = recordsWithRank.slice(5);
  const showTabs = sortedDayRecords.length > 5;
  const activeRecords = !showTabs
    ? recordsWithRank
    : subTab === "top5"
    ? top5Records
    : moreRecords;

  const handleDeleteClick = (id: string) => {
    if (deletingId === id) {
      onDeleteEntry(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      setTimeout(() => {
        setDeletingId((prev) => (prev === id ? null : prev));
      }, 3000);
    }
  };

  return (
    <div
      className="bg-[#fcfdff] rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 medium-blue-shadow border border-blue-100/50 min-h-[450px] sm:min-h-[600px] flex flex-col"
      id="all-time-records-panel"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 sm:p-2.5 bg-amber-50 rounded-2xl border border-amber-200">
            <Trophy className="text-amber-500" size={18} />
          </div>
          <div>
            <h2 className="text-xl font-black text-blue-900 tracking-tight">Kỷ lục các ngày</h2>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
              Kỷ lục cao nhất mỗi ngày
            </span>
          </div>
        </div>
      </div>

      {/* Internal Tabs for Top 5 and further results - only show if there are > 5 entries */}
      {showTabs && (
        <div className="flex bg-[#f0f4fa] p-1.5 rounded-2xl border border-blue-50/50 mb-6 max-w-sm" id="subtab-controller-records">
          <button
            type="button"
            onClick={() => setSubTab("top5")}
            className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === "top5"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 border-none"
                : "text-blue-400 hover:text-blue-600 hover:bg-blue-50/55"
            }`}
          >
            <span>Top 5</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab("more")}
            className={`flex-1 py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === "more"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 border-none"
                : "text-blue-400 hover:text-blue-600 hover:bg-blue-50/55"
            }`}
          >
            <span>Kết quả khác</span>
            {moreRecords.length > 0 && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${
                subTab === "more" ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-500"
              }`}>
                {moreRecords.length}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="overflow-y-auto flex-grow pr-1">
        <div className="space-y-4">
          {activeRecords.map(({ dateKey, entry, rank }) => {
            const isEditingThis = editingId === entry.id;
            const isAbsoluteBest = rank === 1;

            return (
              <div
                key={dateKey}
                className={`p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[2rem] border transition-all relative group flex flex-col justify-between ${
                  isEditingThis
                    ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-400"
                    : isAbsoluteBest
                    ? "bg-gradient-to-br from-amber-50/60 to-orange-50/40 border-amber-200/80 shadow-sm"
                    : "bg-white border-blue-50 hover:border-blue-200"
                }`}
              >
                {/* Header banner for absolute record */}
                {isAbsoluteBest && (
                  <div className="absolute top-3 right-4 flex items-center gap-1 bg-amber-500 text-white font-black text-[8px] uppercase tracking-wider py-1 px-2.5 rounded-full shadow-sm">
                    👑 Kỷ lục mọi thời đại
                  </div>
                )}

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-blue-400" />
                    <span className="text-xs font-extrabold text-blue-500 bg-blue-50/80 px-2 py-0.5 rounded-md">
                      Hạng {rank} • {formatLocalDate(dateKey)}
                    </span>
                    {isEditingThis && (
                      <span className="text-[8px] bg-amber-500 text-white font-black uppercase px-1.5 py-0.5 rounded">
                        Đang sửa
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-base sm:text-lg font-black text-blue-900 truncate">
                      {entry.team}
                    </h3>
                    
                    {/* Jobs rendered in subtle badges */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {entry.jobs.map((j, jidx) => (
                        <span
                          key={jidx}
                          className="text-[8px] bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded-md font-bold uppercase inline-block whitespace-nowrap"
                        >
                          {j.name}: {j.job}
                        </span>
                      ))}
                      {entry.jobs.length === 0 && (
                        <span className="text-[8px] text-slate-300 font-bold uppercase italic">
                          Chuyên phân công trống
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 pl-1">
                    <span className="text-xl sm:text-2xl font-black text-blue-800 tracking-tight">
                      {entry.score.toLocaleString()}
                    </span>
                    <span className="text-[8px] font-black uppercase text-blue-300 tracking-wider">
                      Điểm kỷ lục
                    </span>
                  </div>
                </div>

                {/* Operations overlay or group items */}
                <div className="mt-4 pt-3 border-t border-slate-100/60 flex justify-end items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 transition-opacity duration-150">
                  {!isEditingThis && (
                    <button
                      onClick={() => onEditEntry(entry)}
                      className="text-blue-400 hover:text-blue-600 cursor-pointer p-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-tight"
                      title="Nạp & Chỉnh sửa kỷ lục này"
                    >
                      <Pencil size={13} /> Sửa
                    </button>
                  )}

                  {deletingId === entry.id ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 py-1 px-2 rounded-lg border border-rose-100 animate-pulse ml-2">
                      <button
                        onClick={() => handleDeleteClick(entry.id)}
                        className="text-[9px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer uppercase tracking-tight"
                      >
                        Chắc chắn xóa?
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeleteClick(entry.id)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer p-1.5 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-tight"
                      title="Xóa kết quả kỉ lục này"
                    >
                      <Trash2 size={13} /> Xóa
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {sortedDayRecords.length === 0 && (
            <div className="py-20 text-center text-blue-300 italic text-sm">
              Chưa có kỷ lục nào được ghi nhận
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
