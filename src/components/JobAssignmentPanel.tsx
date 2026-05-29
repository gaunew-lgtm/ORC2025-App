import { useState, useEffect } from "react";
import { JobAssignment } from "../types";
import { X, Plus } from "lucide-react";

interface JobAssignmentPanelProps {
  teamName: string;
  setTeamName: (val: string) => void;
  currentAssigned: JobAssignment[];
  setCurrentAssigned: (val: JobAssignment[]) => void;
  onClear: () => void;
}

export default function JobAssignmentPanel({
  teamName,
  setTeamName,
  currentAssigned,
  setCurrentAssigned,
  onClear,
}: JobAssignmentPanelProps) {
  // Members currently available in the select dropdown
  const [availableMembers, setAvailableMembers] = useState<string[]>([
    "Trí",
    "Nguyên",
    "Doanh",
  ]);
  const [selectedMember, setSelectedMember] = useState<string>("Trí");

  // Track all custom added members so we can restore them properly on reset/clear
  const [allUniqueMembers, setAllUniqueMembers] = useState<string[]>([
    "Trí",
    "Nguyên",
    "Doanh",
  ]);

  // List of active categories of jobs/tasks
  const [jobsList, setJobsList] = useState<string[]>([
    "Nova cũ",
    "Nova mới",
    "Cờ",
  ]);

  // Inline inputs for adding team members and custom tasks without browser prompts
  const [showAddInput, setShowAddInput] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");

  const [showAddJobInput, setShowAddJobInput] = useState(false);
  const [newJobName, setNewJobName] = useState("");

  // 1. Declarative effect: If currentAssigned contains names not in allUniqueMembers, import them
  useEffect(() => {
    const extraNames = currentAssigned
      .map((a) => a.name)
      .filter((name) => !allUniqueMembers.includes(name));

    if (extraNames.length > 0) {
      setAllUniqueMembers((prev) => [...prev, ...extraNames]);
    }
  }, [currentAssigned, allUniqueMembers]);

  // 2. Declarative effect: Filter available unassigned members for the dropdown menu
  useEffect(() => {
    const assignedNames = currentAssigned.map((a) => a.name);
    const unassigned = allUniqueMembers.filter((m) => !assignedNames.includes(m));
    setAvailableMembers(unassigned);

    if (unassigned.length > 0) {
      if (!unassigned.includes(selectedMember)) {
        setSelectedMember(unassigned[0]);
      }
    } else {
      setSelectedMember("");
    }
  }, [currentAssigned, allUniqueMembers, selectedMember]);

  // 3. Declarative effect: Reset custom jobs and custom members list when score is successfully saved/cleared
  useEffect(() => {
    if (currentAssigned.length === 0 && teamName === "") {
      setJobsList(["Nova cũ", "Nova mới", "Cờ"]);
      setAllUniqueMembers(["Trí", "Nguyên", "Doanh"]);
    }
  }, [currentAssigned.length, teamName]);

  const handleAddNewMember = () => {
    const trimmed = newMemberName.trim();
    if (trimmed) {
      if (!allUniqueMembers.includes(trimmed)) {
        setAllUniqueMembers((prev) => [...prev, trimmed]);
        setSelectedMember(trimmed);
      } else {
        setSelectedMember(trimmed);
      }
      setNewMemberName("");
      setShowAddInput(false);
    }
  };

  const handleAddNewJob = () => {
    const trimmed = newJobName.trim();
    if (trimmed) {
      if (!jobsList.includes(trimmed)) {
        setJobsList((prev) => [...prev, trimmed]);
      }
      setNewJobName("");
      setShowAddJobInput(false);
    }
  };

  const assignJob = (job: string) => {
    if (!selectedMember) return;

    // Add to current assignments
    const newAssigned = [...currentAssigned, { name: selectedMember, job }];
    setCurrentAssigned(newAssigned);
  };

  const handleRemoveAssignment = (indexToRemove: number) => {
    const updated = currentAssigned.filter((_, idx) => idx !== indexToRemove);
    setCurrentAssigned(updated);
  };

  const clearJobs = () => {
    setCurrentAssigned([]);
    onClear();
  };

  return (
    <div
      className="bg-[#f8fbff] rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 medium-blue-shadow border border-white/60 flex flex-col"
      id="job-assignment-panel"
    >
      <h2 className="text-xl font-bold text-blue-800 mb-6">Phân công</h2>

      <div className="space-y-5 flex-grow">
        <div>
          <label className="text-xs font-bold text-blue-400 block mb-2">
            Tên đội
          </label>
          <input
            type="text"
            id="teamName"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="w-full p-3.5 sm:p-4 bg-white border border-blue-100 rounded-xl sm:rounded-2xl focus:ring-4 ring-blue-50 outline-none font-bold text-blue-900 animate-none"
            placeholder="Nhập tên đội..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-blue-400 block mb-2">
            Thành viên
          </label>
          {showAddInput ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tên..."
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewMember();
                  }
                }}
                className="w-full p-3.5 sm:p-4 bg-white border border-blue-100 rounded-xl sm:rounded-2xl outline-none font-bold text-blue-900"
                autoFocus
              />
              <button
                onClick={handleAddNewMember}
                className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-700 cursor-pointer active:scale-95 transition-transform"
              >
                Thêm
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddInput(false);
                  setNewMemberName("");
                }}
                className="bg-slate-200 text-slate-600 px-4 rounded-xl font-bold hover:bg-slate-300 cursor-pointer active:scale-95 transition-transform"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                id="userSelect"
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full p-3.5 sm:p-4 bg-white border border-blue-100 rounded-xl sm:rounded-2xl outline-none font-bold text-blue-900 cursor-pointer"
              >
                {availableMembers.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                {availableMembers.length === 0 && (
                  <option value="">Full/Hết thành viên</option>
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowAddInput(true)}
                className="bg-blue-100 text-blue-600 px-4 rounded-xl font-bold hover:bg-blue-200 cursor-pointer active:scale-95 transition-transform flex items-center justify-center text-lg"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-blue-400 block">
              Chọn việc cho thành viên
            </label>
            {!showAddJobInput && (
              <button
                type="button"
                onClick={() => setShowAddJobInput(true)}
                className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 cursor-pointer flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg"
              >
                + Việc khác
              </button>
            )}
          </div>

          {showAddJobInput ? (
            <div className="flex gap-2 p-1.5 bg-blue-50/50 rounded-xl border border-blue-100">
              <input
                type="text"
                placeholder="Ví dụ: Lái xe, cứu hộ..."
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewJob();
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-blue-100 rounded-lg outline-none font-bold text-xs text-blue-900"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddNewJob}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer active:scale-95 whitespace-nowrap"
              >
                Thêm việc
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddJobInput(false);
                  setNewJobName("");
                }}
                className="bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer active:scale-95"
              >
                Hủy
              </button>
            </div>
          ) : (
            <div className={`flex flex-col gap-2 pr-1 ${jobsList.length > 3 ? "max-h-[220px] overflow-y-auto" : ""}`}>
              {jobsList.map((job) => {
                const assigned = currentAssigned.some((a) => a.job === job);
                return (
                  <button
                    key={job}
                    type="button"
                    disabled={assigned || !selectedMember}
                    onClick={() => assignJob(job)}
                    className={`w-full p-3.5 sm:p-4 rounded-xl border border-blue-100 font-bold transition-all flex justify-between items-center text-left ${
                      assigned
                        ? "opacity-35 bg-slate-50 text-slate-400 cursor-not-allowed"
                        : "bg-white text-blue-500 hover:bg-blue-50 active:scale-[0.98] cursor-pointer"
                    }`}
                  >
                    <span className="truncate">{job}</span>
                    {assigned && (
                      <span className="text-[8px] sm:text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                        Đã chọn
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div id="assignmentList" className="space-y-2 mt-4 text-sm">
          {currentAssigned.map((a, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-3 bg-white rounded-xl border border-blue-100 group/item hover:border-red-100 transition-colors"
            >
              <span className="font-bold text-blue-900">{a.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-blue-400 uppercase bg-blue-50/50 px-2.5 py-1 rounded">
                  {a.job}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAssignment(idx)}
                  className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer"
                  title="Xóa nhiệm vụ này"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={clearJobs}
        className="mt-6 w-full p-3.5 sm:p-4 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl sm:rounded-2xl transition-all cursor-pointer active:scale-95"
      >
        Xóa tất cả phân công
      </button>
    </div>
  );
}
