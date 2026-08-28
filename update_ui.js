const fs = require("fs");
let content = fs.readFileSync("src/app/admin/page.tsx", "utf8");

// ── 1. REPLACE LoginScreen with a much better UI ──────────────────────────────
const oldLogin = `function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);`;

const newLogin = `function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);`;

content = content.replace(oldLogin, newLogin);

// Replace the entire LoginScreen return
const oldLoginReturn = `  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse at top,#0a1f3f 0%,#050d1a 60%)",
      fontFamily:"var(--font-rajdhani),sans-serif"
    }}>
      <div style={{
        background:"rgba(10,31,63,0.85)", border:"1px solid rgba(0,210,255,0.3)",
        borderRadius:"16px", padding:"40px 48px", minWidth:"360px",
        boxShadow:"0 0 60px rgba(0,210,255,0.1)"
      }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"22px", fontWeight:700, letterSpacing:"6px", color:"#00d2ff",
            textShadow:"0 0 20px rgba(0,210,255,0.5)", marginBottom:"6px" }}>OVERLAY CTRL</div>
          <div style={{ fontSize:"11px", letterSpacing:"3px", color:"rgba(148,163,184,0.5)" }}>ADMIN ACCESS</div>
        </div>
        <div style={{ marginBottom:"16px" }}>
          <label style={{ display:"block", fontSize:"11px", letterSpacing:"2px", color:"rgba(148,163,184,0.6)", marginBottom:"6px" }}>EMAIL</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doLogin()}
            placeholder="admin@email.com" style={{ width:"100%", boxSizing:"border-box" }} />
        </div>
        <div style={{ marginBottom:"24px" }}>
          <label style={{ display:"block", fontSize:"11px", letterSpacing:"2px", color:"rgba(148,163,184,0.6)", marginBottom:"6px" }}>PASSWORD</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doLogin()}
            placeholder="••••••••" style={{ width:"100%", boxSizing:"border-box" }} />
        </div>
        {error && <div style={{ color:"#ff4444", fontSize:"12px", letterSpacing:"1px", marginBottom:"16px", textAlign:"center" }}>{error}</div>}
        <button className="btn btn-primary btn-full" onClick={doLogin} style={{ letterSpacing:"3px" }} disabled={loading}>
          {loading ? "VERIFYING..." : "LOGIN"}
        </button>
      </div>
    </div>
  );
}`;

const newLoginReturn = `  return (
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
}`;

content = content.replace(oldLoginReturn, newLoginReturn);

// ── 2. ADD QUICK ADD PRESETS above the Add Time input ──────────────────────────
content = content.replace(
  `          <label>Add Time (minutes)</label>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input type="number" value={customAddInput} onChange={e => setCustomAddInput(e.target.value)} placeholder="e.g. 7" min={1} max={999} style={{ flex: 1, margin: 0 }} />
            <button className="btn btn-green" onClick={() => { const v = parseInt(customAddInput||"0"); if(v){ addTime(v); setCustomAddInput(""); } }} style={{ padding: "0 16px", height: "42px", fontSize: "13px" }}>Add</button>
          </div>`,
  `          <label>ADD TIME</label>
          <div className="presets" style={{ marginBottom: "10px" }}>
            {[10,20,30,60].map(m => (
              <div key={m} className="preset-btn" onClick={() => addTime(m)}>{m < 60 ? \`+\${m}min\` : \`+\${m/60}hr\`}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input type="number" value={customAddInput} onChange={e => setCustomAddInput(e.target.value)} placeholder="Custom minutes..." min={1} max={999} style={{ flex: 1, margin: 0 }} />
            <button className="btn btn-green" onClick={() => { const v = parseInt(customAddInput||"0"); if(v){ addTime(v); setCustomAddInput(""); } }} style={{ padding: "0 16px", height: "42px", fontSize: "13px" }}>ADD</button>
          </div>`
);

fs.writeFileSync("src/app/admin/page.tsx", content, "utf8");
console.log("Done! Better login UI + quick add presets added.");