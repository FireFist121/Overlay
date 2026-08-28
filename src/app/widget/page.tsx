"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Donor { name: string; amount: number; }
interface TimerState { remaining: number; running: boolean; total: number; targetEndTime?: number; }
interface OverlayState {
  timer: TimerState; donors: Donor[];
  showTimer: boolean; showDonors: boolean; showAmounts: boolean; updatedAt: number;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatTime(secs: number) {
  secs = Math.max(0, secs);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function formatAmt(n: number) { return "₹" + Number(n).toLocaleString("en-IN"); }

function WidgetInner() {
  const params = useSearchParams();
  const room = params.get("room") || "default";
  const type = params.get("type"); // "timer" | "donors" | null

  const [state, setState] = useState<OverlayState | null>(null);
  const [localSecs, setLocalSecs] = useState(0);
  const [localRunning, setLocalRunning] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdatedAt = useRef(0);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/state?room=${room}`, { cache: "no-store" });
      const data: OverlayState = await res.json();
      if (data.updatedAt !== lastUpdatedAt.current) {
        lastUpdatedAt.current = data.updatedAt;
        setState(data);
        setLocalRunning(data.timer.running);

        if (data.timer.running && data.timer.targetEndTime) {
          const secs = Math.max(0, Math.ceil((data.timer.targetEndTime - Date.now()) / 1000));
          setLocalSecs(secs);
        } else {
          setLocalSecs(data.timer.remaining);
        }
      }
    } catch {}
  }, [room]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 1500);
    return () => clearInterval(id);
  }, [fetchState]);

    // Local tick based on targetEndTime if running
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (localRunning) {
      const endTime = state?.timer.targetEndTime || (Date.now() + localSecs * 1000);
      const update = () => {
        const diff = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setLocalSecs(diff);
        if (diff <= 0) {
          setLocalRunning(false);
        }
      };
      update();
      tickRef.current = setInterval(update, 200);
    }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [localRunning, state?.timer.targetEndTime]);

  if (!state) return null;

  const showTimer  = type !== "donors" && state.showTimer;
  const showDonors = type !== "timer"  && state.showDonors;
  const urgent     = localSecs <= 30 && localRunning;

  return (
    <div style={{ background: "transparent", width: 420, fontFamily: "Inter, sans-serif", overflow: "hidden" }}>
      {showTimer && (
        <div className="timer-block">
          <div className="timer-pill">
            <div className={`timer-display-new${urgent ? " urgent" : ""}`}>{formatTime(localSecs)}</div>
          </div>
          <div className="timer-promo-text"><div>UPI: <span className="promo-gold">pitajiplayz@ibl</span></div><div>₹3K UPI = <span className="promo-gold">+1 HR</span></div></div>
        </div>
      )}
      {showDonors && (
        <div className="donor-block">
          <div className="list-header">
            <span className="list-header-title">TOP SUPPORTERS</span>
          </div>
          <div className="donors-list">
            {state.donors.length === 0 && (
              <div className="empty-state">NO DONATORS YET</div>
            )}
            {state.donors.slice(0, 10).map((d, i) => (
              <div key={d.name} className="donor-card" data-rank={i + 1} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className="donor-rank">#{i + 1}</div>
                <div className="donor-info">
                  <div className="donor-name">{d.name}</div>
                  
                </div>
                {(state.showAmounts ?? true) && d.amount > 0 && (<div className={`donor-amount rank-${i + 1}`}>{formatAmt(d.amount)}</div>)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense>
      <WidgetInner />
    </Suspense>
  );
}