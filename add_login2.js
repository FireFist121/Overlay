const fs = require("fs");
let content = fs.readFileSync("src/app/admin/page.tsx", "utf8");

// Fix 1: Add AUTH constants + LoginScreen before AdminInner
const loginCode = `
const AUTH_KEY    = "overlay_auth_v1";
const LOGIN_EMAIL = "FIREFIST@MAIL.COM";
const LOGIN_PASS  = "OVERLAY.PP";

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [error, setError] = useState("");

  const doLogin = () => {
    if (email.trim().toUpperCase() === LOGIN_EMAIL && pass === LOGIN_PASS) {
      localStorage.setItem(AUTH_KEY, "1");
      onLogin();
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
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
        <button className="btn btn-primary btn-full" onClick={doLogin} style={{ letterSpacing:"3px" }}>
          LOGIN
        </button>
      </div>
    </div>
  );
}

`;

content = content.replace("function AdminInner() {", loginCode + "function AdminInner() {");

// Fix 2: Add isLoggedIn state right after the room declaration
content = content.replace(
  `  const room = params.get("room") || "default";
  
  const [state, setState]`,
  `  const room = params.get("room") || "default";

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(AUTH_KEY) === "1";
  });

  const [state, setState]`
);

// Fix 3: Show login screen if not logged in (insert before "if (!state) return <div...")
content = content.replace(
  `  if (!state) return <div style={{ color: "#00d2ff", fontFamily: "Rajdhani", padding: 40, letterSpacing: 3, fontSize: 14 }}>CONNECTING...</div>;`,
  `  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  if (!state) return <div style={{ color: "#00d2ff", fontFamily: "Rajdhani", padding: 40, letterSpacing: 3, fontSize: 14 }}>CONNECTING...</div>;`
);

fs.writeFileSync("src/app/admin/page.tsx", content, "utf8");
console.log("Login system fully integrated!");