import { useState, useEffect, useTransition, useRef } from "react";

export type CalcKey =
  | "t1"
  | "t2"
  | "t3"
  | "khoi"
  | "co"
  | "red"
  | "early"
  | "calc"
  | "retry"
  | "sabotage"
  | "rules"
  | "frame";

interface ScoreCalculatorProps {
  onSaveScore: (
    score: number,
    stats: Record<CalcKey, number>,
    clearCalculator: () => void
  ) => Promise<void>;
  initialInputs?: Record<CalcKey, number> | null;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}

export default function ScoreCalculator({
  onSaveScore,
  initialInputs,
  isEditing = false,
  onCancelEdit,
}: ScoreCalculatorProps) {
  const [isPending, startTransition] = useTransition();
  const [inputs, setInputs] = useState<Record<CalcKey, number>>({
    t1: 0,
    t2: 0,
    t3: 0,
    khoi: 0,
    co: 0,
    red: 0,
    early: 0,
    calc: 0,
    retry: 0,
    sabotage: 0,
    rules: 0,
    frame: 0,
  });

  // Keep a ref of current inputs to access latest values in the sync effect without triggering it
  const inputsRef = useRef(inputs);
  useEffect(() => {
    inputsRef.current = inputs;
  }, [inputs]);

  // Keep track of the inputs state just before we entered edit mode
  const [backupInputs, setBackupInputs] = useState<Record<CalcKey, number> | null>(null);

  // Sync inputs when editing an existing entry
  useEffect(() => {
    if (isEditing && initialInputs) {
      // Capture a backup of whatever was currently in the calculator before replacing it
      setBackupInputs(inputsRef.current);
      setInputs(initialInputs);
    } else if (!isEditing) {
      // Restoring previous state if we had a backup
      if (backupInputs) {
        setInputs(backupInputs);
        setBackupInputs(null);
      } else {
        clearCalculator();
      }
    }
    // We intentionally omit backupInputs from the dependency list to run this transition ONLY when edit mode changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInputs, isEditing]);

  const handleInputChange = (key: CalcKey, val: string) => {
    // Standardize input parsing, falling back to 0 if invalid
    const parsed = parseInt(val, 10);
    setInputs((prev) => ({
      ...prev,
      [key]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const getPoints = () => {
    const t1Pts = (inputs.t1 || 0) * 5;
    const t2Pts = (inputs.t2 || 0) * 8;
    const t3Pts = (inputs.t3 || 0) * 12;
    const khoiPts = (inputs.khoi || 0) * 10;
    const coPts = (inputs.co || 0) * 10;
    return t1Pts + t2Pts + t3Pts + khoiPts + coPts;
  };

  const getPenalties = () => {
    const redPen = (inputs.red || 0) * 15;
    const earlyPen = (inputs.early || 0) * 20;
    const calcPen = (inputs.calc || 0) * 20;
    const retryPen = (inputs.retry || 0) * 10;
    const sabotagePen = (inputs.sabotage || 0) * 100;
    const rulesPen = (inputs.rules || 0) * 20;
    const framePen = (inputs.frame || 0) * 20;
    return (
      redPen +
      earlyPen +
      calcPen +
      retryPen +
      sabotagePen +
      rulesPen +
      framePen
    );
  };

  const liveScore = getPoints() - getPenalties();

  const clearCalculator = () => {
    setInputs({
      t1: 0,
      t2: 0,
      t3: 0,
      khoi: 0,
      co: 0,
      red: 0,
      early: 0,
      calc: 0,
      retry: 0,
      sabotage: 0,
      rules: 0,
      frame: 0,
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      await onSaveScore(liveScore, inputs, () => {
        if (!isEditing) {
          clearCalculator();
        }
      });
    });
  };

  const renderInputCard = (
    label: string,
    key: CalcKey,
    classes: string = "col-span-1"
  ) => {
    return (
      <div className={`p-3 bg-white rounded-xl border border-blue-50 ${classes}`}>
        <span className="text-[9px] font-bold text-blue-300 uppercase block mb-1">
          {label}
        </span>
        <input
          type="number"
          min="0"
          value={inputs[key] === 0 ? "" : inputs[key]}
          onChange={(e) => handleInputChange(key, e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          className="w-full bg-transparent text-lg font-black text-blue-900 outline-none"
        />
      </div>
    );
  };

  const renderPenaltyCard = (
    label: string,
    key: CalcKey,
    classes: string = "col-span-1",
    indicatorColor: string = "text-rose-500"
  ) => {
    return (
      <div className={`p-2 border border-rose-100 bg-white rounded-xl ${classes}`}>
        <span className="text-[8px] text-rose-300 font-bold block mb-1 uppercase">
          {label}
        </span>
        <input
          type="number"
          min="0"
          value={inputs[key] === 0 ? "" : inputs[key]}
          onChange={(e) => handleInputChange(key, e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          className={`w-full font-bold outline-none ${indicatorColor}`}
        />
      </div>
    );
  };

  return (
    <div
      className={`bg-[#f8fbff] rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-10 medium-blue-shadow border transition-all duration-300 ${
        isEditing ? "border-amber-400 ring-4 ring-amber-50" : "border-white/60"
      }`}
      id="score-calculator-panel"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-blue-800">Tính điểm</h2>
        {isEditing && (
          <span className="text-[10px] sm:text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider animate-pulse">
            Sửa điểm
          </span>
        )}
      </div>

      {/* Positive points grid */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8">
        {renderInputCard("T1 (5)", "t1")}
        {renderInputCard("T2 (8)", "t2")}
        {renderInputCard("T3 (12)", "t3")}
        {renderInputCard("Khối (10)", "khoi", "col-span-1")}
        {renderInputCard("Cờ (10)", "co", "col-span-2 text-center")}
      </div>

      {/* Penalties grid */}
      <div className="grid grid-cols-2 gap-2 mb-6 sm:mb-8">
        {renderPenaltyCard("Banh đỏ -15", "red")}
        {renderPenaltyCard("Sớm hơn -20", "early")}
        {renderPenaltyCard("Tính KQ -20", "calc")}
        {renderPenaltyCard("Retry -10", "retry")}
        {renderPenaltyCard("Phá sân -100", "sabotage", "col-span-2", "text-rose-600 font-black")}
        {renderPenaltyCard("KTT BTC -20", "rules")}
        {renderPenaltyCard("Khung viền -20", "frame")}
      </div>

      {/* Total display & Save / Update / Cancel buttons */}
      <div className="p-5 sm:p-8 bg-blue-900 rounded-[1.75rem] sm:rounded-[2.5rem] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block">
              Tổng
            </span>
            <div id="liveScore" className="text-3xl sm:text-4xl font-black text-white">
              {liveScore.toLocaleString()}
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isPending}
            className={`font-bold py-3 px-5 sm:px-6 rounded-2xl shadow-lg cursor-pointer transition-all active:scale-95 text-xs sm:text-sm text-white ${
              isEditing
                ? "bg-amber-500 hover:bg-amber-400 ring-2 ring-amber-300"
                : "bg-blue-400 hover:bg-blue-300"
            } ${isPending ? "opacity-50 cursor-wait" : ""}`}
            title={isEditing ? "Cập nhật dữ liệu" : "Lưu kết quả mới"}
          >
            {isPending ? "Đang lưu..." : isEditing ? "Cập nhật" : "Lưu kết quả"}
          </button>
        </div>

        {isEditing && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={isPending}
            className="w-full text-center text-xs font-bold text-slate-300 uppercase hover:text-slate-100 py-1 transition-colors hover:underline cursor-pointer"
          >
            Hủy chỉnh sửa
          </button>
        )}
      </div>
    </div>
  );
}
