const fs = require("fs");
let tsx = fs.readFileSync("src/app/admin/page.tsx", "utf8");

// 1. Add isLoggedIn state + login logic right after "function AdminInner()" opens
tsx = tsx.replace(
  `function AdminInner() {
  const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();`,
  `const LOGIN_EMAIL = "FIREFIST@MAIL.COM";
const LOGIN_PASS  = "OVERLAY.PP";
const AUTH_KEY    = "overlay_auth_v1";

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const doLogin = () => {
    if (email.trim().toUpperCase() === LOGIN_EMAIL && pass === LOGIN_PASS) {
      localStorage.setItem(AUTH_KEY, "1");
      onLogin();
    } else {
      setError("Invalid credentials. Try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"radial-gradient(ellipse at top,#0a1f3f 0%,#050d1a 60%)",
      fontFamily:"var(--font-rajdhani),sans-serif"
    }}>
      <div style={{
        background:"rgba(10,31,63,0.8)", border:"1px solid rgba(0,210,255,0.3)",
        borderRadius:"16px", padding:"40px 48px", minWidth:"360px",
        boxShadow:"0 0 60px rgba(0,210,255,0.1)"
      }}>
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ fontSize:"22px", fontWeight:700, letterSpacing:"6px", color:"#00d2ff", textShadow:"0 0 20px rgba(0,210,255,0.5)", marginBottom:"6px" }}>OVERLAY CTRL</div>
          <div style={{ fontSize:"11px", letterSpacing:"3px", color:"rgba(148,163,184,0.5)" }}>ADMIN ACCESS</div>
        </div>
        <div style={{ marginBottom:"16px" }}>
          <label style={{ display:"block", fontSize:"11px", letterSpacing:"2px", color:"rgba(148,163,184,0.6)", marginBottom:"6px" }}>EMAIL</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doLogin()}
            placeholder="Enter email" style={{ width:"100%", boxSizing:"border-box" }} />
        </div>
        <div style={{ marginBottom:"24px" }}>
          <label style={{ display:"block", fontSize:"11px", letterSpacing:"2px", color:"rgba(148,163,184,0.6)", marginBottom:"6px" }}>PASSWORD</label>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doLogin()}
            placeholder="Enter password" style={{ width:"100%", boxSizing:"border-box" }} />
        </div>
        {error && <div style={{ color:"#ff4444", fontSize:"12px", letterSpacing:"1px", marginBottom:"16px", textAlign:"center" }}>{error}</div>}
        <button className="btn btn-primary btn-full" onClick={() => { setLoading(true); doLogin(); }} style={{ letterSpacing:"3px" }}>
          {loading ? "CHECKING..." : "LOGIN"}
        </button>
      </div>
    </div>
  );
}

function AdminInner() {
  const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();`
);

// 2. Add isLoggedIn state near the top of AdminInner, after room useState
tsx = tsx.replace(
  `  const [room]   = useState(() => sp.get("room") || "default");`,
  `  const [room]   = useState(() => sp.get("room") || "default");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTH_KEY) === "1";
  });

  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;`
);

// 3. Add logout button to the nav
tsx = tsx.replace(
  `        <span className="nav-live"><span className="live-dot" />LIVE</span>
      </nav>`,
  `        <span className="nav-live"><span className="live-dot" />LIVE</span>
        <button onClick={() => { localStorage.removeItem(AUTH_KEY); setIsLoggedIn(false); }}
          style={{ marginLeft:"auto", padding:"6px 16px", background:"rgba(255,50,50,0.1)", border:"1px solid rgba(255,50,50,0.3)", borderRadius:"8px", color:"#ff6666", fontFamily:"var(--font-rajdhani),sans-serif", fontSize:"12px", letterSpacing:"2px", cursor:"pointer", transition:"all .2s" }}
          onMouseEnter={e => (e.currentTarget.style.background="rgba(255,50,50,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background="rgba(255,50,50,0.1)")}>
          LOGOUT
        </button>
      </nav>`
);

fs.writeFileSync("src/app/admin/page.tsx", tsx);
console.log("Login system added!");