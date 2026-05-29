import { useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  onSnapshot,
  serverTimestamp,
  getDocFromServer,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";
import { JobAssignment, LeaderboardEntry } from "./types";
import { CalcKey } from "./components/ScoreCalculator";
import { Calculator, Trophy, BarChart2 } from "lucide-react";
import InteractiveTimer from "./components/InteractiveTimer";
import JobAssignmentPanel from "./components/JobAssignmentPanel";
import ScoreCalculator from "./components/ScoreCalculator";
import LeaderboardPanel from "./components/LeaderboardPanel";
import AllTimeRecordsPanel from "./components/AllTimeRecordsPanel";
import StatsPanel from "./components/StatsPanel";

export default function App() {
  const [teamName, setTeamName] = useState<string>("");
  const [currentAssigned, setCurrentAssigned] = useState<JobAssignment[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<LeaderboardEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"calc" | "leaderboard" | "stats">("calc");

  // 1. Validate Connection to Firestore on boot (as requested by CRITICAL CONSTRAINT in Skill documentation)
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("the client is offline")
        ) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // 2. Load leaderboard results in real-time
  useEffect(() => {
    const pathForOnSnapshot = "leaderboard";
    const q = query(collection(db, pathForOnSnapshot));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => {
          const data = d.data();
          let createdAtDate = new Date();
          if (data.createdAt) {
            if (typeof data.createdAt.toDate === "function") {
              createdAtDate = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
              createdAtDate = data.createdAt;
            }
          }
          return {
            id: d.id,
            team: data.team || "Đội vô danh",
            score: Number(data.score) || 0,
            jobs: Array.isArray(data.jobs) ? data.jobs : [],
            createdAt: createdAtDate,
            stats: data.stats || undefined,
          } as LeaderboardEntry;
        });

        // Sort descending by score
        const sorted = items.sort((a, b) => b.score - a.score);
        setLeaderboard(sorted);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Save / Update a match score to Firestore
  const handleSaveScore = async (
    score: number,
    stats: Record<CalcKey, number>,
    clearCalculator: () => void
  ) => {
    const finalTeam = teamName.trim() || "Đội vô danh";
    const pathForWrite = "leaderboard";

    if (editingEntry) {
      // UPDATE MODE
      const entryId = editingEntry.id;
      try {
        await setDoc(doc(db, pathForWrite, entryId), {
          team: finalTeam,
          score: score,
          jobs: currentAssigned,
          createdAt: editingEntry.createdAt, // preserves the original document createdAt timestamp to pass firestore security rules
          stats: stats,
        });

        // Reset editing states & form stats on success
        setEditingEntry(null);
        setTeamName("");
        setCurrentAssigned([]);
        clearCalculator();
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `${pathForWrite}/${entryId}`);
      }
    } else {
      // CREATE MODE
      // Generate a valid alphanumeric ID to pass the rule validation (isValidId check)
      // Format: entry_ + timestamp + random suffix to prevent collisions
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const entryId = `entry_${Date.now()}_${randomSuffix}`;

      try {
         await setDoc(doc(db, pathForWrite, entryId), {
          team: finalTeam,
          score: score,
          jobs: currentAssigned,
          createdAt: serverTimestamp(),
          stats: stats,
        });

        // Reset form states on success
        setTeamName("");
        setCurrentAssigned([]);
        clearCalculator();
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `${pathForWrite}/${entryId}`);
      }
    }
  };

  // 4. Clear all results from Firestore
  const handleClearAll = async () => {
    const pathForDelete = "leaderboard";
    try {
      // Delete every document in our client state individually
      const deletePromises = leaderboard.map((entry) => {
        return deleteDoc(doc(db, pathForDelete, entry.id)).catch((err) => {
          handleFirestoreError(err, OperationType.DELETE, `${pathForDelete}/${entry.id}`);
        });
      });
      await Promise.all(deletePromises);
      
      // If we cleared the board, reset any active edit state
      handleCancelEdit();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, pathForDelete);
    }
  };

  // 5. Delete a single entry from Firestore
  const handleDeleteEntry = async (id: string) => {
    const pathForDelete = "leaderboard";
    try {
      await deleteDoc(doc(db, pathForDelete, id));
      if (editingEntry?.id === id) {
        handleCancelEdit();
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${pathForDelete}/${id}`);
    }
  };

  // Trigger editing and populate input layout fields
  const handleEditEntry = (entry: LeaderboardEntry) => {
    setEditingEntry(entry);
    setTeamName(entry.team);
    setCurrentAssigned(entry.jobs);
    setActiveTab("calc"); // Automatically transition to "Phân Công & Tính Điểm" tab so users can see and modify values.
  };

  // Reset/cancel active editing operation
  const handleCancelEdit = () => {
    setEditingEntry(null);
    setTeamName("");
    setCurrentAssigned([]);
  };

  // Callback to reset state if child triggers a clear on job assignment panel
  const handleJobClear = () => {
    setCurrentAssigned([]);
  };

  // Local date helper to filter today's entries
  const getLocalDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getLocalDateString(new Date());

  // Filter leaderboard to only include entries created on the current local day
  const todayLeaderboard = leaderboard.filter((entry) => {
    return getLocalDateString(entry.createdAt) === todayStr;
  });

  return (
    <div className="px-3.5 py-6 sm:p-10 min-h-screen">
      <h1 className="text-4xl sm:text-6xl font-black text-blue-900 tracking-tighter text-center mb-8 uppercase">
        ORC 2025
      </h1>

      {/* Timer Controller */}
      <InteractiveTimer />

      {/* Dynamic Segmented Custom Tab Controller */}
      <div className="flex justify-center mb-8 px-1">
        <div id="tab-controller" className="bg-[#f0f7ff] p-1.5 rounded-[2rem] sm:rounded-[2.5rem] inline-flex gap-1.5 border border-white/80 medium-blue-shadow w-full max-w-[720px] shadow-lg">
          <button
            onClick={() => setActiveTab("calc")}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-3 sm:py-4 rounded-[1.75rem] sm:rounded-[2rem] text-[10px] sm:text-sm font-black uppercase tracking-wide sm:tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === "calc"
                ? "bg-blue-600 text-white shadow-md sm:shadow-lg shadow-blue-500/25 scale-[1.01] border-none"
                : "text-blue-400 hover:text-blue-600 hover:bg-blue-50/55"
            }`}
          >
            <Calculator size={15} className="shrink-0" />
            <span className="truncate">Phân Công & Tính Điểm</span>
          </button>
          
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-3 sm:py-4 rounded-[1.75rem] sm:rounded-[2rem] text-[10px] sm:text-sm font-black uppercase tracking-wide sm:tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === "leaderboard"
                ? "bg-blue-600 text-white shadow-md sm:shadow-lg shadow-blue-500/25 scale-[1.01] border-none"
                : "text-blue-400 hover:text-blue-600 hover:bg-blue-50/55"
            }`}
          >
            <Trophy size={15} className="shrink-0" />
            <span className="truncate">Xếp Hạng & Kỷ Lục</span>
            {leaderboard.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black scale-90 ${
                activeTab === "leaderboard" ? "bg-blue-800 text-white" : "bg-blue-100/80 text-blue-500"
              }`}>
                {leaderboard.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-3 sm:py-4 rounded-[1.75rem] sm:rounded-[2rem] text-[10px] sm:text-sm font-black uppercase tracking-wide sm:tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === "stats"
                ? "bg-blue-600 text-white shadow-md sm:shadow-lg shadow-blue-500/25 scale-[1.01] border-none"
                : "text-blue-400 hover:text-blue-600 hover:bg-blue-50/55"
            }`}
          >
            <BarChart2 size={15} className="shrink-0" />
            <span className="truncate">Thống Kê</span>
          </button>
        </div>
      </div>

      {/* Grid container separated into tabs */}
      <div className="max-w-[1500px] mx-auto min-h-[500px]">
        {activeTab === "calc" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch animate-fadeIn">
            {/* Rectangle 1: Job Assignment */}
            <JobAssignmentPanel
              teamName={teamName}
              setTeamName={setTeamName}
              currentAssigned={currentAssigned}
              setCurrentAssigned={setCurrentAssigned}
              onClear={handleJobClear}
            />

            {/* Rectangle 2: Calculator */}
            <ScoreCalculator
              onSaveScore={handleSaveScore}
              initialInputs={editingEntry?.stats || null}
              isEditing={!!editingEntry}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        ) : activeTab === "leaderboard" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch animate-fadeIn">
            {/* Rectangle 3: Leaderboard (Today's Leaderboard) */}
            <LeaderboardPanel
              entries={todayLeaderboard}
              onClearAll={handleClearAll}
              onDeleteEntry={handleDeleteEntry}
              onEditEntry={handleEditEntry}
              editingId={editingEntry?.id || null}
            />

            {/* Rectangle 4: All-Time / Daily Highest Records */}
            <AllTimeRecordsPanel
              entries={leaderboard}
              onDeleteEntry={handleDeleteEntry}
              onEditEntry={handleEditEntry}
              editingId={editingEntry?.id || null}
            />
          </div>
        ) : (
          <div className="animate-fadeIn max-w-5xl mx-auto">
            <StatsPanel entries={leaderboard} />
          </div>
        )}
      </div>
    </div>
  );
}
