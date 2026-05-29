import { useState, useEffect, useRef } from "react";

export default function InteractiveTimer() {
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use a ref to track alerts that have already fired in this timer cycle to prevent infinite / redundant popups.
  const alertedTimesRef = useRef<Set<number>>(new Set());

  // Show a non-blocking toast notification that vanishes after 5 seconds
  const showNotification = (msg: string) => {
    setNotification(msg);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const elapsed = 120 - timeLeft;

  // Alerts triggering on specific values of timeLeft / elapsed
  useEffect(() => {
    if (!isRunning) return;

    // "Tự động còn 10 giây" at elapsed === 20
    if (elapsed === 20 && !alertedTimesRef.current.has(20)) {
      alertedTimesRef.current.add(20);
      showNotification("Tự động còn 10 giây");
    }

    // "Còn 60 giây" at timeLeft === 60
    if (timeLeft === 60 && !alertedTimesRef.current.has(60)) {
      alertedTimesRef.current.add(60);
      showNotification("Còn 60 giây");
    }

    // "Còn 30 giây" at timeLeft === 30
    if (timeLeft === 30 && !alertedTimesRef.current.has(30)) {
      alertedTimesRef.current.add(30);
      showNotification("Còn 30 giây");
    }

    // "10 giây cuối" at timeLeft === 10
    if (timeLeft === 10 && !alertedTimesRef.current.has(10)) {
      alertedTimesRef.current.add(10);
      showNotification("10 giây cuối!");
    }
  }, [timeLeft, elapsed, isRunning]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(120);
    setNotification(null);
    alertedTimesRef.current.clear();
  };

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeStr = `${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;

  // Decide mode label
  let modeLabel = "Chờ bắt đầu";
  if (isRunning || timeLeft < 120) {
    if (elapsed <= 30) {
      modeLabel = "Chế độ tự động";
    } else {
      modeLabel = "Chế độ thủ công";
    }
  }

  // Determine pulse animation condition:
  // - first 30s (elapsed <= 30), it is active if elapsed >= 20
  // - after 30s, it is active if timeLeft <= 10
  const shouldPulse =
    isRunning &&
    ((elapsed <= 30 && elapsed >= 20) || (elapsed > 30 && timeLeft <= 10));

  return (
    <div className="flex justify-center mb-8 px-4" id="timer-section">
      <div className="bg-[#f0f7ff] p-5 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] medium-blue-shadow border border-white flex flex-col sm:flex-row items-center gap-6 sm:gap-10 w-full max-w-md sm:max-w-xl">
        <div className="text-center min-w-[120px]">
          <div
            id="timerMode"
            className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em] mb-1"
          >
            {modeLabel}
          </div>
          <div
            id="displayTime"
            className={`text-5xl sm:text-6xl font-black text-blue-900 leading-none ${
              shouldPulse ? "alert-pulse" : ""
            }`}
          >
            {timeStr}
          </div>
          {notification && (
            <div className="mt-2.5 text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50/75 px-3 py-1.5 rounded-xl border border-amber-100/80 inline-block animate-pulse">
              ⚠️ {notification}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-grow">
          <button
            id="timerBtn"
            onClick={toggleTimer}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-sm sm:text-base cursor-pointer"
          >
            {isRunning ? "Tạm dừng" : timeLeft < 120 ? "Tiếp tục" : "Bắt đầu"}
          </button>
          <button
            onClick={resetTimer}
            className="text-xs font-bold text-blue-300 uppercase hover:text-blue-500 text-center py-1 cursor-pointer"
          >
            Đặt lại
          </button>
        </div>
      </div>
    </div>
  );
}
