"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Donor { name: string; amount: number; }
interface TimerState { remaining: number; running: boolean; total: number; targetEndTime?: number; }
interface OverlayState {
  timer: TimerState;
  donors: Donor[];
  showTimer: boolean;
  showDonors: boolean;
  showAmounts: boolean;
  updatedAt: number;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmt(secs: number) {
  secs = Math.max(0, secs);
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function fmtAmt(n: number) { return "Rs " + Number(n).toLocaleString("en-IN"); }
function parseTimeInput(input: string): number {
  if (!input) return 0;
  const parts = input.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0] * 60;
  return 0;
}


function AdminInner() {
  const params = useSearchParams();
  const room = params.get("room") || "default";

  const [state, setState] = useState<OverlayState | null>(null);
  const stateRef = useRef<OverlayState | null>(null); // always latest state

  const [localSecs, setLocalSecs] = useState(0);
  const localSecsRef = useRef(0); // always latest secs

  const [localRunning, setLocalRunning] = useState(false);
  const localRunningRef = useRef(false);

  const [timerInput, setTimerInput] = useState("10");
  const [customAddInput, setCustomAddInput] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorAmount, setDonorAmount] = useState("");
  const [donorColor, setDonorColor] = useState("#00d2ff");
  const [toast, setToast] = useState("");

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const lastUpdated = useRef(0);
  const isPushing = useRef(false);

  // Keep refs in sync with state
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { localSecsRef.current = localSecs; }, [localSecs]);
  useEffect(() => { localRunningRef.current = localRunning; }, [localRunning]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // ── FETCH ──────────────────────────────────────────────────────────────────
  const fetchState = useCallback(async () => {
    if (isPushing.current) return;
    try {
      const res = await fetch(`/api/state?room=${room}`, { cache: "no-store" });
      const data: OverlayState = await res.json();
      if (data.updatedAt !== lastUpdated.current) {
        lastUpdated.current = data.updatedAt;
        setState(data);
        stateRef.current = data;
        setLocalRunning(data.timer.running);
        localRunningRef.current = data.timer.running;
        if (data.timer.running && data.timer.targetEndTime) {
          endTimeRef.current = data.timer.targetEndTime;
          const s = Math.max(0, Math.ceil((data.timer.targetEndTime - Date.now()) / 1000));
          setLocalSecs(s); localSecsRef.current = s;
        } else {
          endTimeRef.current = null;
          setLocalSecs(data.timer.remaining);
          localSecsRef.current = data.timer.remaining;
        }
      }
    } catch {}
  }, [room]);

  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState]);

  // ── LOCAL TICK ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!localRunning) return;
    tickRef.current = setInterval(() => {
      if (endTimeRef.current) {
        const diff = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
        setLocalSecs(diff); localSecsRef.current = diff;
        if (diff <= 0) { setLocalRunning(false); localRunningRef.current = false; endTimeRef.current = null; }
      } else {
        setLocalSecs(s => { const n = s > 0 ? s - 1 : 0; localSecsRef.current = n; return n; });
      }
    }, 500);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [localRunning]);

  // ── PUSH ───────────────────────────────────────────────────────────────────
  // Always reads from stateRef so it never uses a stale closure
  const push = useCallback(async (patch: Partial<OverlayState>) => {
    const current = stateRef.current;
    if (!current) return;
    isPushing.current = true;
    const next: OverlayState = { ...current, ...patch, updatedAt: Date.now() };
    setState(next);
    stateRef.current = next;
    lastUpdated.current = next.updatedAt;
    try {
      await fetch(`/api/state?room=${room}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
    } catch {}
    setTimeout(() => { isPushing.current = false; }, 300);
  }, [room]);

  // ── TIMER ACTIONS ──────────────────────────────────────────────────────────
  const timerStart = useCallback(() => {
    const current = stateRef.current;
    if (!current) return;
    const totalSecs = parseTimeInput(timerInput) || 600;
    const secs = localSecsRef.current > 0 ? localSecsRef.current : totalSecs;
    const total = current.timer.total || totalSecs;
    const targetEndTime = Date.now() + secs * 1000;
    endTimeRef.current = targetEndTime;
    setLocalSecs(secs); localSecsRef.current = secs;
    setLocalRunning(true); localRunningRef.current = true;
    push({ timer: { remaining: secs, running: true, total, targetEndTime } });
    showToast("Timer Started!");
  }, [timerInput, push]);

  const timerPause = useCallback(() => {
    setLocalRunning(false); localRunningRef.current = false;
    if (tickRef.current) clearInterval(tickRef.current);
    endTimeRef.current = null;
    const current = stateRef.current;
    push({ timer: { remaining: localSecsRef.current, running: false, total: current?.timer.total || 0 } });
    showToast("Timer Paused");
  }, [push]);

  const timerReset = useCallback(() => {
    const totalSecs = parseTimeInput(timerInput) || 600;
    setLocalRunning(false); localRunningRef.current = false;
    setLocalSecs(totalSecs); localSecsRef.current = totalSecs;
    if (tickRef.current) clearInterval(tickRef.current);
    endTimeRef.current = null;
    push({ timer: { remaining: totalSecs, running: false, total: totalSecs } });
    showToast("Timer Reset");
  }, [timerInput, push]);

  const setPreset = useCallback((m: number) => {
    setTimerInput(String(m));
    setLocalSecs(m * 60); localSecsRef.current = m * 60;
    setLocalRunning(false); localRunningRef.current = false;
    if (tickRef.current) clearInterval(tickRef.current);
    endTimeRef.current = null;
    push({ timer: { remaining: m * 60, running: false, total: m * 60 } });
    showToast(`Set to ${m} min`);
  }, [push]);

  const addTime = useCallback((m: number) => {
    const current = stateRef.current;
    if (!current) return;
    const added = m * 60;
    const curSecs = localSecsRef.current;
    const newSecs = Math.max(0, curSecs + added);
    let targetEndTime: number | undefined;
    if (localRunningRef.current) {
      targetEndTime = Date.now() + newSecs * 1000;
      endTimeRef.current = targetEndTime;
    }
    setLocalSecs(newSecs); localSecsRef.current = newSecs;
    push({ timer: { remaining: newSecs, running: localRunningRef.current, total: Math.max(current.timer.total || newSecs, newSecs), targetEndTime } });
    showToast(`${m > 0 ? "+" : ""}${m} min`);
  }, [push]);

  // ── DONOR ACTIONS ──────────────────────────────────────────────────────────
  const addDonor = useCallback(() => {
    const current = stateRef.current;
    if (!current) { showToast("Not connected!"); return; }
    if (!donorName.trim()) { showToast("Enter a name!"); return; }
    const amount = parseInt(donorAmount) || 0;
    const existing = [...current.donors];
    const idx = existing.findIndex(d => d.name.toLowerCase() === donorName.trim().toLowerCase());
    if (idx >= 0) existing[idx].amount = amount;
    else existing.push({ name: donorName.trim(), amount });
    existing.sort((a, b) => b.amount - a.amount);
    setDonorName(""); setDonorAmount("");
    push({ donors: existing });
    showToast(`${donorName.trim()} added!`);
  }, [donorName, donorAmount, push]);

  const deleteDonor = useCallback((name: string) => {
    const current = stateRef.current;
    if (!current) return;
    push({ donors: current.donors.filter(d => d.name !== name) });
    showToast(`${name} removed`);
  }, [push]);

  const clearAll = useCallback(() => {
    if (!confirm("Clear ALL donors?")) return;
    push({ donors: [] });
    showToast("All donors cleared");
  }, [push]);

  const toggleVis = useCallback((which: "timer" | "donors" | "amounts", val: boolean) => {
    if (which === "timer") push({ showTimer: val });
    else if (which === "donors") push({ showDonors: val });
    else push({ showAmounts: val });
  }, [push]);

  // ── LINKS ──────────────────────────────────────────────────────────────────
  const base = typeof window !== "undefined" ? `${window.location.origin}/widget` : "/widget";
  const linkCombined = `${base}?room=${room}`;
  const linkTimer    = `${base}?room=${room}&type=timer`;
  const linkDonors   = `${base}?room=${room}&type=donors`;
  const copyLink = (txt: string) => { navigator.clipboard.writeText(txt); showToast("Link Copied!"); };

  if (!state) return <div style={{ color: "#00d2ff", fontFamily: "Rajdhani", padding: 40, letterSpacing: 3, fontSize: 14 }}>CONNECTING...</div>;

  return (
    <div className="admin-root">
      <nav className="admin-nav">
        <span className="nav-logo">OVERLAY CTRL</span>
        <span className="nav-badge">OBS ADMIN</span>
        <span className="nav-room">ROOM: {room}</span>
        <span className="nav-live"><span className="live-dot" />LIVE</span>
      </nav>

      <div className="admin-layout">
        {/* TIMER */}
        <div className="card">
          <div className="card-title"><span>Timer</span> Countdown Timer</div>
          <div className={`timer-big${localSecs <= 30 && localRunning ? " urgent" : ""}`}>{fmt(localSecs)}</div>
          <div className="timer-status">{localRunning ? "RUNNING" : localSecs <= 0 ? "FINISHED" : "PAUSED"}</div>
          <div className="btn-row">
            <button className="btn btn-green" onClick={timerStart}>Start</button>
            <button className="btn btn-orange" onClick={timerPause}>Pause</button>
            <button className="btn btn-red btn-sm" onClick={timerReset}>Reset</button>
          </div>

          <label>SET TIME</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input type="text" value={timerInput} onChange={e => setTimerInput(e.target.value)} placeholder="HH:MM:SS" style={{ flex: 1, margin: 0 }} />
            <button className="btn btn-cyan" onClick={timerReset} style={{ padding: "0 16px", height: "42px", fontSize: "13px" }}>Set</button>
          </div>

          <label>ADD PRESETS</label>
          <div className="presets" style={{ marginBottom: "12px" }}>
            {[10,20,40,60,120,180].map(m => (
              <div key={m} className="preset-btn" onClick={() => addTime(m)}>{m < 60 ? `${m}min` : `${m/60}hr`}</div>
            ))}
          </div>

          <label>Add Custom Time (minutes)</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input type="number" value={customAddInput} onChange={e => setCustomAddInput(e.target.value)} placeholder="e.g. 7" min={1} max={999} style={{ flex: 1, margin: 0 }} />
            <button className="btn btn-green" onClick={() => { const v = parseInt(customAddInput||"0"); if(v){ addTime(v); setCustomAddInput(""); } }} style={{ padding: "0 16px", height: "42px", fontSize: "13px" }}>Add</button>
          </div>

          <label>REMOVE TIME</label>
          <div className="presets" style={{ marginBottom: "12px" }}>
            {[-10,-20,-30,-60].map(m => (
              <div key={m} className="preset-btn-red" onClick={() => addTime(m)}>{m === -60 ? '-1hr' : `${m}min`}</div>
            ))}
          </div>
        </div>

        {/* DONORS */}
        <div className="card">
          <div className="card-title"><span>Donors</span> Manage Donators</div>
          <label>Donor Name</label>
          <input type="text" value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="e.g. Dhaval"
            onKeyDown={e => e.key === "Enter" && document.getElementById("amt-input")?.focus()} />
          <label>Amount (Rs) — optional</label>
          <input id="amt-input" type="number" value={donorAmount} onChange={e => setDonorAmount(e.target.value)}
            placeholder="Leave 0 or blank to hide" min={0} onKeyDown={e => e.key === "Enter" && addDonor()} />
          <button className="btn btn-primary btn-full" onClick={addDonor}>Add / Update Donor</button>
          <div className="donor-admin-list">
            {state.donors.length === 0
              ? <div className="dai-empty">NO DONATORS YET</div>
              : state.donors.map((d, i) => (
                  <div key={d.name} className="donor-admin-item">
                    <div className="dai-rank">{i+1}</div>
                    <div className="dai-name" style={{ color: d.color || "#00d2ff" }}>{d.name}</div>
                    <div className="dai-amt">{d.amount > 0 ? fmtAmt(d.amount) : "-"}</div>
                    <button className="dai-del" onClick={() => deleteDonor(d.name)}>X</button>
                  </div>
                ))}
          </div>
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn btn-red btn-sm" onClick={clearAll}>Clear All</button>
          </div>
        </div>

        {/* VISIBILITY */}
        <div className="card full-card">
          <div className="card-title"><span>Visibility</span> Widget Visibility</div>
          <div className="toggle-row">
            <span className="toggle-label">Show Timer Widget</span>
            <label className="toggle">
              <input type="checkbox" checked={state.showTimer} onChange={e => toggleVis("timer", e.target.checked)} />
              <div className="toggle-slider" />
            </label>
          </div>
          <div className="toggle-row">
            <span className="toggle-label">Show Donator Leaderboard</span>
            <label className="toggle">
              <input type="checkbox" checked={state.showDonors} onChange={e => toggleVis("donors", e.target.checked)} />
              <div className="toggle-slider" />
            </label>
          </div>
          <div className="toggle-row">
            <span className="toggle-label">Show Amounts on Leaderboard</span>
            <label className="toggle">
              <input type="checkbox" checked={state.showAmounts ?? true} onChange={e => toggleVis("amounts", e.target.checked)} />
              <div className="toggle-slider" />
            </label>
          </div>
        </div>

        {/* LINKS */}
        <div className="card full-card">
          <div className="card-title"><span>OBS</span> Widget Links for OBS</div>
          {([
            ["Combined (Timer + Donors)", linkCombined, "btn-primary"],
            ["Timer Only", linkTimer, "btn-cyan"],
            ["Donator Leaderboard Only", linkDonors, "btn-orange"],
          ] as const).map(([label, link, cls]) => (
            <div key={label} className="link-row">
              <div style={{ flex: 1 }}>
                <label>{label}</label>
                <input type="text" readOnly value={link} onClick={e => (e.target as HTMLInputElement).select()} />
              </div>
              <button className={`btn ${cls}`} onClick={() => copyLink(link)}>Copy</button>
            </div>
          ))}
        </div>
      </div>

      {toast && <div className="admin-toast show">{toast}</div>}
      <div style={{ textAlign: "center", padding: "16px 0 8px", fontFamily: "var(--font-rajdhani, Rajdhani), sans-serif", fontSize: "12px", letterSpacing: "3px", color: "rgba(148,163,184,0.4)", textTransform: "uppercase" }}>
        Made by <span style={{ color: "var(--cyan)", textShadow: "0 0 8px rgba(0,210,255,0.3)" }}>FireFist</span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return <Suspense><AdminInner /></Suspense>;
}