import { useState } from "react";
import { LeaderboardEntry } from "../types";
import { Trash2, X, Pencil } from "lucide-react";

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  onClearAll: () => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onEditEntry: (entry: LeaderboardEntry) => void;
  editingId: string | null;
}

export default function LeaderboardPanel({
  entries,
  onClearAll,
  onDeleteEntry,
  onEditEntry,
  editingId,
}: LeaderboardPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<"top5" | "more">("top5");

  // Format rank number clearly
  const getOrdinal = (n: number) => {
    return `#${n}`;
  };

  const handleClear = () => {
    if (!isConfirming) {
      setIsConfirming(true);
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => {
        setIsConfirming(false);
      }, 3000);
    } else {
      setIsConfirming(false);
      onClearAll();
    }
  };

  const handleDeleteClick = (id: string) => {
    if (deletingId === id) {
      onDeleteEntry(id);
      setDeletingId(null);
    } else {
      setDeletingId(id);
      // Automatically reset deleting state after 3 seconds if not confirmed
      setTimeout(() => {
        setDeletingId((prev) => (prev === id ? null : prev));
      }, 3000);
    }
  };

  const todayFormatted = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const rankedEntries = entries.map((entry, idx) => ({
    entry,
    rank: idx + 1,
  }));

  const top5Entries = rankedEntries.slice(0, 5);
  const moreEntries = rankedEntries.slice(5);

  const showTabs = entries.length > 5;
  const activeEntries = !showTabs ? rankedEntries : (subTab === "top5" ? top5Entries : moreEntries);

  return (
    <div
      className="bg-[#f8fbff] rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 medium-blue-shadow border border-white/60 min-h-[450px] sm:min-h-[600px] flex flex-col"
      id="leaderboard-panel"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-blue-800">Bảng xếp hạng</h2>
          <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mt-0.5">
            Hôm nay: {todayFormatted}
          </span>
        </div>
        <button
          onClick={handleClear}
          className={`text-[10px] font-black uppercase cursor-pointer transition-colors ${
            isConfirming
              ? "text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-2 py-1 rounded"
              : "text-rose-300 hover:text-rose-500"
          }`}
        >
          {isConfirming ? "Chắc chắn xóa?" : "Xóa hết"}
        </button>
      </div>

      {/* Internal Tabs for Top 5 and further results - only show if there are > 5 entries */}
      {showTabs && (
        <div className="flex bg-[#f0f4fa] p-1.5 rounded-2xl border border-blue-50/50 mb-6 max-w-sm" id="subtab-controller">
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
            {moreEntries.length > 0 && (
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${
                subTab === "more" ? "bg-blue-800 text-white" : "bg-blue-100 text-blue-500"
              }`}>
                {moreEntries.length}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="overflow-y-auto flex-grow pr-1">
        <table className="w-full text-left font-sans text-sm sm:text-base">
          <thead className="text-[10px] font-black text-blue-200 uppercase tracking-widest border-b border-blue-50/80">
            <tr>
              <th className="py-3 px-1.5 sm:px-2">Hạng</th>
              <th className="py-3 px-1.5 sm:px-2">Đội và Việc</th>
              <th className="py-3 px-1.5 sm:px-2 text-right">Điểm</th>
              <th className="py-3 px-1.5 sm:px-2 text-right w-20"></th>
            </tr>
          </thead>
          <tbody>
            {activeEntries.map(({ entry, rank }) => {
              const isEditingThis = editingId === entry.id;
              return (
                <tr
                  key={entry.id}
                  className={`border-b border-blue-50/50 hover:bg-white transition-all group ${
                    isEditingThis
                      ? "bg-amber-50/75 border-amber-200/60 ring-2 ring-amber-400 rounded-lg"
                      : ""
                  }`}
                >
                  <td className="py-4 px-1.5 sm:px-2 font-bold text-blue-200 shrink-0">
                    {getOrdinal(rank)}
                  </td>
                  <td className="py-4 px-1.5 sm:px-2">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5 flex-wrap">
                      <span className="truncate max-w-[120px] sm:max-w-none">{entry.team}</span>
                      {isEditingThis && (
                        <span className="text-[8px] bg-amber-500 text-white font-black uppercase px-1.5 py-0.5 rounded whitespace-nowrap">
                          Sửa
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.jobs.map((j, jidx) => (
                        <span
                          key={jidx}
                          className="text-[8px] bg-blue-50 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase inline-block whitespace-nowrap"
                        >
                          {j.name}: {j.job}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-1.5 sm:px-2 text-right font-black text-blue-700 text-lg sm:text-xl shrink-0">
                    {entry.score.toLocaleString()}
                  </td>
                  <td className="py-4 px-1.5 sm:px-2 text-right shrink-0">
                    <div className="flex items-center justify-end gap-1">
                      {/* Edit Button */}
                      {!isEditingThis && (
                        <button
                          onClick={() => onEditEntry(entry)}
                          className="text-blue-300 hover:text-blue-600 cursor-pointer p-1.5 rounded-lg hover:bg-blue-50 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 duration-150"
                          title="Sửa / Nạp điểm"
                        >
                          <Pencil size={14} />
                        </button>
                      )}

                      {/* Delete Button / Dialog */}
                      {deletingId === entry.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 py-1 px-1 rounded-lg border border-rose-100 animate-pulse">
                          <button
                            onClick={() => handleDeleteClick(entry.id)}
                            className="text-[9px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer uppercase tracking-tight"
                          >
                            Xóa?
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleDeleteClick(entry.id)}
                          className="text-slate-300 hover:text-rose-500 cursor-pointer p-1.5 rounded-lg hover:bg-rose-50 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100 duration-150"
                          title="Xóa kết quả này"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {activeEntries.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="py-16 text-center text-blue-200 italic"
                >
                  {subTab === "top5" ? "Chưa có bảng xếp hạng" : "Không có kết quả khác"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
