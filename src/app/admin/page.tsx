"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Donor { name: string; amount: number; color?: string; }
interface TimerState { remaining: number; running: boolean; total: number; targetEndTime?: number; }
interface OverlayState {
  timer: TimerState;
  donors: Donor[];
  showTimer: boolean;
  showDonors: boolean;
  showAmounts: boolean;
  updatedAt: number;
}
interface LogEntry {
  _id?: string;
  room: string;
  action: string;
  details: string;
  timestamp: number;
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



const AUTH_TOKEN_KEY = "overlay_session_token";

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const doLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) { setError(data.error || "Invalid credentials."); setLoading(false); return; }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      onLogin();
    } catch {
      setError("Network error. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse at 30% 20%,#061428 0%,#030810 100%)",
      fontFamily:"var(--font-rajdhani),sans-serif", position:"relative", overflow:"hidden"
    }}>
      {/* BG glow orbs */}
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,210,255,0.06) 0%,transparent 70%)", top:"-10%", left:"-5%", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,80,200,0.08) 0%,transparent 70%)", bottom:"10%", right:"5%", pointerEvents:"none" }} />

      <div style={{
        background:"linear-gradient(135deg,rgba(0,20,50,0.95) 0%,rgba(5,15,35,0.98) 100%)",
        border:"1px solid rgba(0,210,255,0.2)",
        borderRadius:"20px", padding:"44px 48px", width:"380px",
        boxShadow:"0 0 80px rgba(0,210,255,0.08), inset 0 1px 0 rgba(0,210,255,0.1)",
        backdropFilter:"blur(20px)", position:"relative"
      }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:"36px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:"linear-gradient(135deg,#0080ff,#00d2ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, boxShadow:"0 0 20px rgba(0,210,255,0.4)" }}>⚡</div>
            <span style={{ fontSize:"20px", fontWeight:800, letterSpacing:"5px", color:"#fff" }}>OVERLAY CTRL</span>
          </div>
          <div style={{ fontSize:"10px", letterSpacing:"4px", color:"rgba(0,210,255,0.5)", textTransform:"uppercase" }}>Secure Admin Access</div>
        </div>

        {/* Email */}
        <div style={{ marginBottom:"18px" }}>
          <label style={{ display:"block", fontSize:"10px", fontWeight:600, letterSpacing:"2px", color:"rgba(148,163,184,0.7)", marginBottom:"8px", textTransform:"uppercase" }}>Email Address</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doLogin()}
            placeholder="Enter your email"
            style={{ width:"100%", boxSizing:"border-box", background:"rgba(0,210,255,0.04)", border:"1px solid rgba(0,210,255,0.15)", borderRadius:"10px", color:"#fff", fontSize:"14px", padding:"12px 16px", outline:"none", transition:"border .2s" }}
            onFocus={e => e.target.style.borderColor="rgba(0,210,255,0.5)"}
            onBlur={e => e.target.style.borderColor="rgba(0,210,255,0.15)"} />
        </div>

        {/* Password */}
        <div style={{ marginBottom:"28px" }}>
          <label style={{ display:"block", fontSize:"10px", fontWeight:600, letterSpacing:"2px", color:"rgba(148,163,184,0.7)", marginBottom:"8px", textTransform:"uppercase" }}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doLogin()}
              placeholder="Enter your password"
              style={{ width:"100%", boxSizing:"border-box", background:"rgba(0,210,255,0.04)", border:"1px solid rgba(0,210,255,0.15)", borderRadius:"10px", color:"#fff", fontSize:"14px", padding:"12px 44px 12px 16px", outline:"none", transition:"border .2s" }}
              onFocus={e => e.target.style.borderColor="rgba(0,210,255,0.5)"}
              onBlur={e => e.target.style.borderColor="rgba(0,210,255,0.15)"} />
            <button onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"rgba(148,163,184,0.5)", cursor:"pointer", fontSize:16, padding:4 }}>
              {showPass ? "🙈" : "👁"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background:"rgba(255,50,50,0.08)", border:"1px solid rgba(255,50,50,0.3)", borderRadius:"8px", padding:"10px 14px", color:"#ff6666", fontSize:"12px", letterSpacing:"1px", marginBottom:"20px", textAlign:"center" }}>
            ⚠ {error}
          </div>
        )}

        <button onClick={doLogin} disabled={loading} style={{
          width:"100%", padding:"14px", borderRadius:"10px", border:"none", cursor: loading ? "not-allowed" : "pointer",
          background: loading ? "rgba(0,80,150,0.4)" : "linear-gradient(135deg,#0055cc,#00a8e8)",
          color:"#fff", fontFamily:"var(--font-rajdhani),sans-serif", fontSize:"14px", fontWeight:700,
          letterSpacing:"4px", textTransform:"uppercase",
          boxShadow: loading ? "none" : "0 4px 24px rgba(0,150,255,0.3)",
          transition:"all .2s"
        }}
          onMouseEnter={e => { if(!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
          {loading ? "VERIFYING..." : "LOGIN →"}
        </button>

        <div style={{ textAlign:"center", marginTop:"20px", fontSize:"10px", letterSpacing:"2px", color:"rgba(148,163,184,0.25)" }}>
          MADE BY FIREFIST
        </div>
      </div>
    </div>
  );
}

function AdminInner() {
  const params = useSearchParams();
  const room = params.get("room") || "default";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) { setAuthChecked(true); return; }
    fetch(`/api/auth?token=${token}`)
      .then(r => r.json())
      .then(d => { setIsLoggedIn(!!d.valid); setAuthChecked(true); })
      .catch(() => setAuthChecked(true));
  }, []);

  const [state, setState] = useState<OverlayState | null>(null);
  const stateRef = useRef<OverlayState | null>(null); // always latest state

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [localSecs, setLocalSecs] = useState(0);
  const localSecsRef = useRef(0); // always latest secs

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

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

  const fetchLogs = useCallback(async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) return;
      document.cookie = `admin_token=${token}; path=/; max-age=3600`;
      
      setLogsLoading(true);
      const res = await fetch(`/api/logs?room=${room}&limit=50`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch {}
    finally { setLogsLoading(false); }
  }, [room]);

  useEffect(() => {
    fetchState();
    fetchLogs();
    const id = setInterval(fetchState, 2000);
    return () => clearInterval(id);
  }, [fetchState, fetchLogs]);

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

  const handleDragStart = useCallback((i: number) => setDragIdx(i), []);
  const handleDragOver  = useCallback((e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i); }, []);
  const handleDrop      = useCallback((i: number) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const current = stateRef.current;
    if (!current) return;
    const updated = [...current.donors];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(i, 0, moved);
    push({ donors: updated });
    showToast("Order updated!");
    setDragIdx(null); setDragOverIdx(null);
  }, [dragIdx, push]);
  const handleDragEnd   = useCallback(() => { setDragIdx(null); setDragOverIdx(null); }, []);

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

  if (!authChecked) return <div style={{ color: "#00d2ff", fontFamily: "Rajdhani", padding: 40, letterSpacing: 3, fontSize: 14, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>AUTHENTICATING...</div>;
  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  if (!state) return <div style={{ color: "#00d2ff", fontFamily: "Rajdhani", padding: 40, letterSpacing: 3, fontSize: 14 }}>CONNECTING...</div>;

  return (
    <div className="admin-root">
      <nav className="admin-nav">
        <span className="nav-logo">OVERLAY CTRL</span>
        <span className="nav-badge">OBS ADMIN</span>
        <span className="nav-room">ROOM: {room}</span>
        <span className="nav-live"><span className="live-dot" />LIVE</span>
        <button onClick={async () => {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(AUTH_TOKEN_KEY);
            if (token) await fetch("/api/logout", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ token }) });
            setIsLoggedIn(false);
          }}
          style={{ marginLeft:"auto", padding:"6px 16px", background:"rgba(255,50,50,0.1)", border:"1px solid rgba(255,50,50,0.3)", borderRadius:"8px", color:"#ff6666", fontFamily:"var(--font-rajdhani),sans-serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", transition:"all .2s" }}
          onMouseEnter={e => (e.currentTarget.style.background="rgba(255,50,50,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background="rgba(255,50,50,0.1)")}>
          LOGOUT
        </button>
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

          <label>ADD TIME</label>
          <div className="presets" style={{ marginBottom: "10px" }}>
            {[10,20,30,60,120,180,240].map(m => (
              <div key={m} className="preset-btn" onClick={() => addTime(m)}>{m < 60 ? `+${m}min` : `+${m/60}hr`}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input type="number" value={customAddInput} onChange={e => setCustomAddInput(e.target.value)} placeholder="Custom minutes..." min={1} max={999} style={{ flex: 1, margin: 0 }} />
            <button className="btn btn-green" onClick={() => { const v = parseInt(customAddInput||"0"); if(v){ addTime(v); setCustomAddInput(""); } }} style={{ padding: "0 16px", height: "42px", fontSize: "13px" }}>ADD</button>
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
                  <div
                    key={d.name}
                    className={`donor-admin-item${dragIdx === i ? " dai-dragging" : ""}${dragOverIdx === i && dragIdx !== i ? " dai-drag-over" : ""}`}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={() => handleDrop(i)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="drag-handle" title="Drag to reorder">⠿</div>
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

        {/* LOGS */}
        <div className="card full-card">
          <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span><span style={{ color: "var(--cyan)" }}>Logs</span> Activity Log</span>
            <button className="btn btn-cyan btn-sm" onClick={fetchLogs} disabled={logsLoading} style={{ fontSize: "11px", padding: "4px 8px", height: "auto" }}>
              {logsLoading ? "..." : "Refresh"}
            </button>
          </div>
          <div style={{ maxHeight: "300px", overflowY: "auto", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "8px", border: "1px solid rgba(255,255,255,0.05)" }}>
            {logs.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: "12px", fontFamily: "var(--font-rajdhani), sans-serif", letterSpacing: "1px" }}>NO LOGS FOUND</div>
            ) : (
              logs.map((log, i) => (
                <div key={log._id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", borderBottom: i === logs.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "bold", color: "#fff", marginBottom: "2px" }}>{log.action}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>{log.details}</div>
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(0,210,255,0.7)", textAlign: "right" }}>
                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                    <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
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